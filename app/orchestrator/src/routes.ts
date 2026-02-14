import { Router, Request, Response } from 'express';
import Docker from 'dockerode';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import tar from 'tar-stream';

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

// Read env vars lazily (dotenv may not have loaded at import time)
const env = () => ({
  CONTAINER_IMAGE: process.env.CONTAINER_IMAGE || 'instantworker/worker:latest',
  GOOGLE_AI_KEY: process.env.GOOGLE_AI_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  // LiteLLM proxy — when set, containers call LiteLLM instead of real APIs
  LITELLM_URL: process.env.LITELLM_URL || '', // e.g. http://172.17.0.1:4000
  LITELLM_KEY: process.env.LITELLM_KEY || '', // proxy master key
  GATEWAY_PORT_START: parseInt(process.env.GATEWAY_PORT_START || '20000'),
  GATEWAY_PORT_END: parseInt(process.env.GATEWAY_PORT_END || '21999'),
  NOVNC_PORT_START: parseInt(process.env.NOVNC_PORT_START || '22000'),
  NOVNC_PORT_END: parseInt(process.env.NOVNC_PORT_END || '23999'),
  WORKER_TEMPLATES_PATH: process.env.WORKER_TEMPLATES_PATH || '/opt/osobnirobot/worker-templates',
});

// Track allocated ports to avoid collisions
const allocatedPorts = new Set<number>();

export const containerRoutes = Router();

// ─── Helper: find next available port in range ───
async function findAvailablePort(start: number, end: number): Promise<number> {
  const containers = await docker.listContainers({ all: true });
  const usedPorts = new Set<number>();

  for (const c of containers) {
    if (c.Ports) {
      for (const p of c.Ports) {
        if (p.PublicPort) usedPorts.add(p.PublicPort);
      }
    }
  }

  // Also track in-memory allocations (for rapid back-to-back provisions)
  for (const p of allocatedPorts) {
    usedPorts.add(p);
  }

  for (let port = start; port <= end; port++) {
    if (!usedPorts.has(port)) {
      allocatedPorts.add(port);
      return port;
    }
  }

  throw new Error(`No available ports in range ${start}-${end}`);
}

// ─── Helper: get container name ───
// Prefer employeeId-based naming, fall back to userId for backward compat
function containerName(employeeId?: string, userId?: string): string {
  if (employeeId) {
    return `iw-${employeeId.slice(0, 12)}`;
  }
  if (userId) {
    return `iw-${userId.slice(0, 12)}`;
  }
  throw new Error('Either employeeId or userId is required');
}

// ─── Helper: get shared volume name for user ───
function sharedVolumeName(userId: string): string {
  return `iw-shared-${userId.slice(0, 12)}`;
}

// ─── Helper: ensure shared volume exists ───
async function ensureSharedVolume(userId: string): Promise<string> {
  const volName = sharedVolumeName(userId);
  try {
    await docker.getVolume(volName).inspect();
  } catch {
    // Volume doesn't exist — create it
    await docker.createVolume({ Name: volName });
    console.log(`♦ Created shared volume ${volName}`);
  }
  return volName;
}

// ─── Helper: read file from container via docker exec ───
async function readContainerFile(containerRef: Docker.Container, filePath: string): Promise<string | null> {
  try {
    const exec = await containerRef.exec({
      Cmd: ['sh', '-c', `cat "${filePath}" 2>/dev/null`],
      AttachStdout: true,
      AttachStderr: false,
    });
    const stream = await exec.start({ Detach: false, Tty: false });
    return new Promise((resolve) => {
      let output = '';
      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString('utf-8');
      });
      stream.on('end', () => {
        // Clean up docker stream headers (first 8 bytes of each frame)
        const cleaned = output.replace(/[\x00-\x07]/g, '').trim();
        // Return null for empty output or error messages that leaked through
        if (!cleaned || cleaned.includes('No such file') || cleaned.includes('cat:')) {
          resolve(null);
          return;
        }
        resolve(cleaned);
      });
      stream.on('error', () => resolve(null));
    });
  } catch {
    return null;
  }
}

// ─── Helper: write file to container via docker exec ───
async function writeContainerFile(containerRef: Docker.Container, filePath: string, content: string): Promise<boolean> {
  try {
    // Ensure parent directory exists
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    const mkdirExec = await containerRef.exec({
      Cmd: ['mkdir', '-p', dir],
      AttachStdout: true,
      AttachStderr: true,
    });
    await mkdirExec.start({ Detach: false, Tty: false });

    // Write file using tar archive (most reliable method for Docker)
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const pack = tar.pack();
    pack.entry({ name: fileName }, content);
    pack.finalize();

    const tarChunks: Buffer[] = [];
    for await (const chunk of pack) {
      tarChunks.push(chunk as Buffer);
    }
    const tarBuffer = Buffer.concat(tarChunks);

    await containerRef.putArchive(Readable.from(tarBuffer), { path: dir });
    return true;
  } catch {
    return false;
  }
}

// ─── Helper: list files in container directory via docker exec ───
async function listContainerFiles(containerRef: Docker.Container, dirPath: string): Promise<string[]> {
  try {
    const exec = await containerRef.exec({
      Cmd: ['ls', '-1', dirPath],
      AttachStdout: true,
      AttachStderr: true,
    });
    const stream = await exec.start({ Detach: false, Tty: false });
    return new Promise((resolve) => {
      let output = '';
      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString('utf-8');
      });
      stream.on('end', () => {
        const cleaned = output.replace(/[\x00-\x07]/g, '').trim();
        const files = cleaned ? cleaned.split('\n').filter(f => f.trim()) : [];
        resolve(files);
      });
      stream.on('error', () => resolve([]));
    });
  } catch {
    return [];
  }
}

// ─── Helper: build workspace files from templates ───
function buildWorkspace(
  workerType: string,
  workerConfig: {
    skills?: string[];
    niche?: string;
    targets?: string[];
    brandDescription?: string;
    timezone?: string;
    companyUrl?: string;
    clientDescription?: string;
    competitorUrls?: string[];
  },
  assistantName: string,
  personality: string
): string {
  // Create a temp directory with the workspace files
  const tmpDir = path.join('/tmp', `iw-workspace-${randomUUID()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // Determine primary skill template to use
  const primarySkill = workerType || 'x-commenter';
  const templateDir = path.join(env().WORKER_TEMPLATES_PATH, primarySkill);
  const sharedDir = path.join(env().WORKER_TEMPLATES_PATH, '_shared');

  // Copy SOUL.md from skill template (or shared fallback)
  let soulContent = '';
  const soulPath = path.join(templateDir, 'SOUL.md');
  if (fs.existsSync(soulPath)) {
    soulContent = fs.readFileSync(soulPath, 'utf-8');
  } else if (fs.existsSync(path.join(sharedDir, 'SOUL.md'))) {
    soulContent = fs.readFileSync(path.join(sharedDir, 'SOUL.md'), 'utf-8');
  }

  // Replace template variables
  soulContent = soulContent
    .replace(/\{\{ASSISTANT_NAME\}\}/g, assistantName)
    .replace(/\{\{PERSONALITY\}\}/g, personality || 'Professional and helpful')
    .replace(/\{\{NICHE\}\}/g, workerConfig.niche || 'general');

  // Append LEARNING-PROTOCOL.md to SOUL.md
  const learningProtocolPath = path.join(sharedDir, 'LEARNING-PROTOCOL.md');
  if (fs.existsSync(learningProtocolPath)) {
    const learningContent = fs.readFileSync(learningProtocolPath, 'utf-8');
    soulContent += '\n\n---\n\n' + learningContent;
  }

  // Append SKILLMAKER.md (hidden learning skill) to SOUL.md
  const skillmakerPath = path.join(sharedDir, 'SKILLMAKER.md');
  if (fs.existsSync(skillmakerPath)) {
    const skillmakerContent = fs.readFileSync(skillmakerPath, 'utf-8');
    soulContent += '\n\n---\n\n' + skillmakerContent;
  }

  fs.writeFileSync(path.join(tmpDir, 'SOUL.md'), soulContent);

  // Copy HEARTBEAT.md
  const heartbeatPath = path.join(templateDir, 'HEARTBEAT.md');
  if (fs.existsSync(heartbeatPath)) {
    fs.writeFileSync(
      path.join(tmpDir, 'HEARTBEAT.md'),
      fs.readFileSync(heartbeatPath, 'utf-8')
    );
  }

  // Build config directory
  const configDir = path.join(tmpDir, 'config');
  fs.mkdirSync(configDir, { recursive: true });

  // targets.json — inject user's targets
  const targets = workerConfig.targets || [];
  const targetsJson = {
    accounts: targets.filter(t => t.startsWith('@')),
    hashtags: targets.filter(t => t.startsWith('#')),
    niche: workerConfig.niche || '',
  };
  fs.writeFileSync(path.join(configDir, 'targets.json'), JSON.stringify(targetsJson, null, 2));

  // company-config.json — company research data from onboarding
  const companyConfig = {
    companyUrl: workerConfig.companyUrl || '',
    clientDescription: workerConfig.clientDescription || '',
    competitorUrls: workerConfig.competitorUrls || [],
    niche: workerConfig.niche || '',
  };
  fs.writeFileSync(path.join(configDir, 'company-config.json'), JSON.stringify(companyConfig, null, 2));

  // rules.md
  const rulesContent = [
    `# Rules for ${assistantName}`,
    '',
    `## Niche: ${workerConfig.niche || 'General'}`,
    '',
    `## Timezone: ${workerConfig.timezone || 'UTC'}`,
    '',
    '## Brand Voice',
    workerConfig.brandDescription || 'Be helpful, professional, and authentic.',
    '',
    '## Active Skills',
    ...(workerConfig.skills || [primarySkill]).map(s => `- ${s}`),
  ].join('\n');
  fs.writeFileSync(path.join(configDir, 'rules.md'), rulesContent);

  // brand-voice.md
  if (workerConfig.brandDescription) {
    fs.writeFileSync(
      path.join(configDir, 'brand-voice.md'),
      `# Brand Voice\n\n${workerConfig.brandDescription}\n`
    );
  }

  // Copy skill-specific SKILL.md files for multi-skill workers
  const skillsDir = path.join(tmpDir, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });

  const skillIds = workerConfig.skills || [primarySkill];
  for (const skillId of skillIds) {
    const skillTemplateDir = path.join(env().WORKER_TEMPLATES_PATH, skillId);
    // Copy the skill's SOUL.md as a skill instruction file
    const skillSoulPath = path.join(skillTemplateDir, 'SOUL.md');
    if (fs.existsSync(skillSoulPath)) {
      let content = fs.readFileSync(skillSoulPath, 'utf-8');
      content = content
        .replace(/\{\{ASSISTANT_NAME\}\}/g, assistantName)
        .replace(/\{\{PERSONALITY\}\}/g, personality || 'Professional and helpful')
        .replace(/\{\{NICHE\}\}/g, workerConfig.niche || 'general');
      fs.writeFileSync(path.join(skillsDir, `${skillId}.md`), content);
    }
  }

  // Copy shared reference guides
  const refDir = path.join(sharedDir, 'reference');
  if (fs.existsSync(refDir)) {
    const destRefDir = path.join(tmpDir, 'reference');
    fs.mkdirSync(destRefDir, { recursive: true });
    for (const file of fs.readdirSync(refDir)) {
      fs.copyFileSync(path.join(refDir, file), path.join(destRefDir, file));
    }
  }

  // Create docs directory with editable user documents
  const docsDir = path.join(tmpDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  // Seed doc templates from _shared/docs/ if they exist, otherwise use inline defaults
  const sharedDocsDir = path.join(sharedDir, 'docs');
  if (fs.existsSync(sharedDocsDir)) {
    for (const file of fs.readdirSync(sharedDocsDir)) {
      let content = fs.readFileSync(path.join(sharedDocsDir, file), 'utf-8');
      // Replace template variables in doc templates
      content = content
        .replace(/\{\{COMPANY_URL\}\}/g, workerConfig.companyUrl || '')
        .replace(/\{\{CLIENT_DESCRIPTION\}\}/g, workerConfig.clientDescription || '')
        .replace(/\{\{NICHE\}\}/g, workerConfig.niche || '')
        .replace(/\{\{COMPETITOR_URLS\}\}/g, (workerConfig.competitorUrls || []).join('\n- '));
      fs.writeFileSync(path.join(docsDir, file), content);
    }
  }

  // Create memory directory with template files
  const memoryDir = path.join(tmpDir, 'memory');
  fs.mkdirSync(memoryDir, { recursive: true });

  // Copy memory templates from _shared/memory/
  const sharedMemoryDir = path.join(sharedDir, 'memory');
  if (fs.existsSync(sharedMemoryDir)) {
    for (const file of fs.readdirSync(sharedMemoryDir)) {
      fs.copyFileSync(path.join(sharedMemoryDir, file), path.join(memoryDir, file));
    }
  }

  return tmpDir;
}

// Container workspace path inside Docker (must match OPENCLAW_HOME in entrypoint.sh)
const CONTAINER_WORKSPACE = '/home/node/.openclaw/workspace';

// ─── POST /provision — Create a new container ───
containerRoutes.post('/provision', async (req: Request, res: Response) => {
  try {
    const { userId, employeeId, assistantName, personality, workerType, workerConfig } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const name = containerName(employeeId, userId);

    // Check if container already exists
    try {
      const existing = docker.getContainer(name);
      const info = await existing.inspect();
      if (info.State.Running) {
        return res.json({
          container: {
            status: 'running',
            gatewayPort: info.HostConfig?.PortBindings?.['18789/tcp']?.[0]?.HostPort,
            novncPort: info.HostConfig?.PortBindings?.['6080/tcp']?.[0]?.HostPort,
            gatewayToken: info.Config?.Env?.find((e: string) => e.startsWith('GATEWAY_TOKEN='))?.split('=')[1],
          },
        });
      }
      // Container exists but stopped — remove it first
      await existing.remove({ force: true });
    } catch {
      // Container doesn't exist — good, create it
    }

    // Allocate ports
    const gatewayPort = await findAvailablePort(env().GATEWAY_PORT_START, env().GATEWAY_PORT_END);
    const novncPort = await findAvailablePort(env().NOVNC_PORT_START, env().NOVNC_PORT_END);
    const gatewayToken = randomUUID();

    // Build workspace from templates
    const workspaceDir = buildWorkspace(
      workerType || 'x-commenter',
      workerConfig || {},
      assistantName || 'Worker',
      personality || ''
    );

    // Ensure shared volume exists for this user
    const sharedVol = await ensureSharedVolume(userId);

    console.log(`♦ Provisioning container ${name}: gateway=${gatewayPort}, novnc=${novncPort}`);

    // Build container env vars — use LiteLLM proxy when available
    const useLiteLLM = !!(env().LITELLM_URL && env().LITELLM_KEY);
    const containerEnv = [
      `GATEWAY_TOKEN=${gatewayToken}`,
      `OPENCLAW_GATEWAY_PORT=18789`,
      `NOVNC_PORT=6080`,
      `ASSISTANT_NAME=${assistantName || 'Worker'}`,
      `WORKER_TYPE=${workerType || 'general'}`,
    ];

    if (useLiteLLM) {
      // Containers get proxy URL + key, never see real API keys
      containerEnv.push(`LITELLM_URL=${env().LITELLM_URL}`);
      containerEnv.push(`LITELLM_KEY=${env().LITELLM_KEY}`);
      console.log(`♦ Using LiteLLM proxy at ${env().LITELLM_URL}`);
    } else {
      // Fallback: pass real API keys directly (not recommended for production)
      containerEnv.push(`GOOGLE_AI_KEY=${env().GOOGLE_AI_KEY}`);
      containerEnv.push(`ANTHROPIC_API_KEY=${env().ANTHROPIC_API_KEY}`);
    }

    // Per-worker HTTP proxy for browser isolation (unique IP per worker)
    // IPRoyal sticky sessions: append _session-{id} to username for per-worker IP
    const baseProxyUrl = workerConfig?.proxyUrl || process.env.DEFAULT_WORKER_PROXY || '';
    if (baseProxyUrl) {
      let workerProxyUrl = baseProxyUrl;
      // Auto-generate sticky session per worker by appending _session-{employeeId} to username
      const proxyMatch = baseProxyUrl.match(/^(https?:\/\/)([^:]+):([^@]+)@(.+)$/);
      if (proxyMatch && employeeId) {
        const sessionId = employeeId.slice(0, 12);
        workerProxyUrl = `${proxyMatch[1]}${proxyMatch[2]}_session-${sessionId}:${proxyMatch[3]}@${proxyMatch[4]}`;
      }
      containerEnv.push(`WORKER_PROXY_URL=${workerProxyUrl}`);
      console.log(`♦ Worker proxy configured with sticky session: ${workerProxyUrl.replace(/:[^:@]*@/, ':***@')}`);
    }

    // Create container
    const container = await docker.createContainer({
      Image: env().CONTAINER_IMAGE,
      name,
      Env: containerEnv,
      HostConfig: {
        PortBindings: {
          '18789/tcp': [{ HostPort: String(gatewayPort) }],
          '6080/tcp': [{ HostPort: String(novncPort) }],
        },
        Binds: [
          `${workspaceDir}:/defaults/workspace:ro`,
          `${sharedVol}:${CONTAINER_WORKSPACE}/shared`,
        ],
        RestartPolicy: { Name: 'unless-stopped' },
        Memory: 2 * 1024 * 1024 * 1024, // 2GB
        NanoCpus: 2000000000, // 2 CPU cores
        ShmSize: 256 * 1024 * 1024, // 256MB shared memory (needed for Chrome)
        // Security hardening (Step 4.5)
        CapDrop: ['ALL'],
        CapAdd: ['SYS_ADMIN'], // needed for Chrome sandbox
        SecurityOpt: ['no-new-privileges'],
        PidsLimit: 512,
      },
      Labels: {
        'instantworker': 'true',
        'instantworker.user': userId,
        'instantworker.employee': employeeId || '',
        'instantworker.name': assistantName || 'Worker',
        'instantworker.skill': workerType || 'general',
      },
    });

    await container.start();

    // Release port reservation from in-memory tracker (Docker now manages them)
    allocatedPorts.delete(gatewayPort);
    allocatedPorts.delete(novncPort);

    console.log(`♦ Container ${name} started`);

    res.json({
      container: {
        status: 'running',
        gatewayPort,
        novncPort,
        gatewayToken,
      },
    });
  } catch (err: any) {
    console.error('Provision error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /status/:id — Get container status ───
// Accepts either employeeId or userId (backward compat)
containerRoutes.get('/status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);

    try {
      const container = docker.getContainer(name);
      const info = await container.inspect();

      const gatewayPort = info.HostConfig?.PortBindings?.['18789/tcp']?.[0]?.HostPort;
      const novncPort = info.HostConfig?.PortBindings?.['6080/tcp']?.[0]?.HostPort;

      res.json({
        exists: true,
        status: info.State.Running ? 'running' : info.State.Status === 'exited' ? 'stopped' : 'error',
        gatewayPort: gatewayPort ? parseInt(gatewayPort) : null,
        novncPort: novncPort ? parseInt(novncPort) : null,
      });
    } catch {
      res.json({ exists: false, status: 'none' });
    }
  } catch (err: any) {
    console.error('Status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /restart — Restart a container ───
containerRoutes.post('/restart', async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.body;
    if (!userId && !employeeId) {
      return res.status(400).json({ error: 'userId or employeeId is required' });
    }

    const name = containerName(employeeId, userId);
    const container = docker.getContainer(name);

    await container.restart({ t: 10 }); // 10 second grace period

    console.log(`♦ Container ${name} restarted`);
    res.json({ success: true, status: 'running' });
  } catch (err: any) {
    console.error('Restart error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /stop — Stop a container ───
containerRoutes.post('/stop', async (req: Request, res: Response) => {
  try {
    const { userId, employeeId } = req.body;
    if (!userId && !employeeId) {
      return res.status(400).json({ error: 'userId or employeeId is required' });
    }

    const name = containerName(employeeId, userId);
    const container = docker.getContainer(name);

    await container.stop({ t: 10 });

    console.log(`♦ Container ${name} stopped`);
    res.json({ success: true, status: 'stopped' });
  } catch (err: any) {
    // If container doesn't exist or is already stopped, that's fine
    if (err.statusCode === 304 || err.statusCode === 404) {
      return res.json({ success: true, status: 'stopped' });
    }
    console.error('Stop error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /remove/:id — Remove a container entirely ───
containerRoutes.delete('/remove/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    await container.remove({ force: true });

    console.log(`♦ Container ${name} removed`);
    res.json({ success: true });
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json({ success: true });
    }
    console.error('Remove error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /files/:id — List reference files in container ───
containerRoutes.get('/files/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    const refDir = `${CONTAINER_WORKSPACE}/reference`;
    const files = await listContainerFiles(container, refDir);

    // Get file sizes in parallel using stat
    const fileList = await Promise.all(
      files.map(async (f) => {
        let size = 0;
        try {
          const exec = await container.exec({
            Cmd: ['stat', '-c', '%s', `${refDir}/${f}`],
            AttachStdout: true,
            AttachStderr: false,
          });
          const stream = await exec.start({ Detach: false, Tty: false });
          const sizeOutput = await new Promise<string>((resolve) => {
            let out = '';
            stream.on('data', (chunk: Buffer) => { out += chunk.toString('utf-8'); });
            stream.on('end', () => resolve(out.replace(/[\x00-\x07]/g, '').trim()));
            stream.on('error', () => resolve('0'));
          });
          size = parseInt(sizeOutput) || 0;
        } catch {
          // size stays 0
        }
        return { name: f, size };
      })
    );
    res.json(fileList);
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json([]);
    }
    console.error('List files error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /files/:id — Upload file into container reference dir ───
containerRoutes.post('/files/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    // Read multipart form data
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    // Collect body chunks
    const chunks: Buffer[] = [];
    for await (const chunk of req as unknown as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Parse boundary from content-type
    const boundaryMatch = contentType.match(/boundary=(.+?)(?:;|$)/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Missing boundary' });
    }
    const boundary = boundaryMatch[1];

    // Simple multipart parser to extract filename and file content
    const bodyStr = body.toString('latin1');
    const parts = bodyStr.split(`--${boundary}`);
    let fileName = '';
    let fileBuffer: Buffer | null = null;

    for (const part of parts) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;
      const headers = part.substring(0, headerEnd);
      const filenameMatch = headers.match(/filename="(.+?)"/);
      if (filenameMatch) {
        fileName = path.basename(filenameMatch[1]); // sanitize path
        const contentStart = headerEnd + 4;
        // Remove trailing \r\n before next boundary
        const contentEnd = part.length - 2;
        const contentStr = part.substring(contentStart, contentEnd);
        fileBuffer = Buffer.from(contentStr, 'latin1');
        break;
      }
    }

    if (!fileName || !fileBuffer) {
      return res.status(400).json({ error: 'No file found in upload' });
    }

    // Create tar archive with the file, then put it into the container
    const pack = tar.pack();
    pack.entry({ name: fileName }, fileBuffer);
    pack.finalize();

    const tarChunks: Buffer[] = [];
    for await (const chunk of pack) {
      tarChunks.push(chunk as Buffer);
    }
    const tarBuffer = Buffer.concat(tarChunks);

    await container.putArchive(Readable.from(tarBuffer), {
      path: `${CONTAINER_WORKSPACE}/reference/`,
    });

    console.log(`♦ Uploaded ${fileName} to ${name}`);
    res.json({ success: true, filename: fileName });
  } catch (err: any) {
    console.error('Upload file error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /files/:id/:filename — Delete reference file from container ───
containerRoutes.delete('/files/:id/:filename', async (req: Request, res: Response) => {
  try {
    const { id, filename } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    // Sanitize filename to prevent path traversal
    const safeName = path.basename(filename);
    const filePath = `${CONTAINER_WORKSPACE}/reference/${safeName}`;

    const exec = await container.exec({
      Cmd: ['rm', '-f', filePath],
      AttachStdout: true,
      AttachStderr: true,
    });
    await exec.start({ Detach: false, Tty: false });

    console.log(`♦ Deleted ${safeName} from ${name}`);
    res.json({ success: true });
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json({ success: true });
    }
    console.error('Delete file error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /memory/:id — Read memory files from container ───
containerRoutes.get('/memory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    const memoryDir = `${CONTAINER_WORKSPACE}/memory`;

    // Read key memory files in parallel
    const [companyProfile, researchFindings, pendingQuestions, suggestions] = await Promise.all([
      readContainerFile(container, `${memoryDir}/company-profile.md`),
      readContainerFile(container, `${memoryDir}/research-findings.md`),
      readContainerFile(container, `${memoryDir}/pending-questions.md`),
      readContainerFile(container, `${memoryDir}/suggestions.md`),
    ]);

    res.json({
      companyProfile,
      researchFindings,
      pendingQuestions,
      suggestions,
    });
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json({
        companyProfile: null,
        researchFindings: null,
        pendingQuestions: null,
        suggestions: null,
      });
    }
    console.error('Memory read error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Editable docs directory inside container ───
const DOCS_DIR = `${CONTAINER_WORKSPACE}/docs`;

// List of known doc types (filename → metadata)
const DOC_TYPES: Record<string, { title: string; description: string }> = {
  'company.md': { title: 'About My Company', description: 'Company name, website, mission, key facts' },
  'competitors.md': { title: 'Competitors', description: 'Competitor names, URLs, strengths, weaknesses' },
  'audience.md': { title: 'Target Audience', description: 'Customer personas, pain points, demographics' },
  'product.md': { title: 'Product / Service', description: 'What you sell, features, pricing, USP' },
  'brand-voice.md': { title: 'Brand Voice', description: 'Tone, style, dos and don\'ts for content' },
  'instructions.md': { title: 'Custom Instructions', description: 'Free-form instructions for your employee' },
  'goals.md': { title: 'Goals & Expectations', description: 'Content goals, output targets, success metrics, platform limits' },
};

// ─── GET /docs/:id — Read all editable docs from container ───
containerRoutes.get('/docs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    // Read all doc files in parallel
    const entries = await Promise.all(
      Object.entries(DOC_TYPES).map(async ([filename, meta]) => {
        const content = await readContainerFile(container, `${DOCS_DIR}/${filename}`);
        return { filename, ...meta, content: content || '' };
      })
    );

    res.json(entries);
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json([]);
    }
    console.error('List docs error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /docs/:id/:filename — Read single doc ───
containerRoutes.get('/docs/:id/:filename', async (req: Request, res: Response) => {
  try {
    const { id, filename } = req.params;
    const safeName = path.basename(filename);
    if (!DOC_TYPES[safeName]) {
      return res.status(400).json({ error: 'Unknown document type' });
    }

    const name = containerName(id);
    const container = docker.getContainer(name);
    const content = await readContainerFile(container, `${DOCS_DIR}/${safeName}`);

    res.json({ filename: safeName, ...DOC_TYPES[safeName], content: content || '' });
  } catch (err: any) {
    console.error('Read doc error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /docs/:id/:filename — Write/update single doc ───
containerRoutes.put('/docs/:id/:filename', async (req: Request, res: Response) => {
  try {
    const { id, filename } = req.params;
    const safeName = path.basename(filename);
    if (!DOC_TYPES[safeName]) {
      return res.status(400).json({ error: 'Unknown document type' });
    }

    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'content (string) is required' });
    }

    // Limit doc size to 50KB
    if (content.length > 50 * 1024) {
      return res.status(400).json({ error: 'Document too large. Max 50KB.' });
    }

    const name = containerName(id);
    const container = docker.getContainer(name);
    const success = await writeContainerFile(container, `${DOCS_DIR}/${safeName}`, content);

    if (!success) {
      return res.status(500).json({ error: 'Failed to write document' });
    }

    console.log(`♦ Updated doc ${safeName} in ${name}`);
    res.json({ success: true, filename: safeName });
  } catch (err: any) {
    console.error('Write doc error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /improvements — Harvest improvement suggestions from ALL running containers ───
// This is the flywheel: workers discover better approaches → we harvest → update playbooks → all workers improve
containerRoutes.get('/improvements', async (_req: Request, res: Response) => {
  try {
    // List all running InstantWorker containers
    const containers = await docker.listContainers({
      filters: { label: ['instantworker=true'], status: ['running'] },
    });

    const results: Array<{
      containerId: string;
      containerName: string;
      employeeId: string;
      userId: string;
      skill: string;
      improvements: string | null;
    }> = [];

    // Read improvement-suggestions.md from each container in parallel
    await Promise.all(
      containers.map(async (info) => {
        const container = docker.getContainer(info.Id);
        const improvements = await readContainerFile(
          container,
          `${CONTAINER_WORKSPACE}/memory/improvement-suggestions.md`
        );

        // Only include containers that have actual suggestions (not just the empty template)
        const hasContent = improvements && improvements.split('\n').length > 13;

        results.push({
          containerId: info.Id.slice(0, 12),
          containerName: info.Names?.[0]?.replace('/', '') || 'unknown',
          employeeId: info.Labels?.['instantworker.employee'] || '',
          userId: info.Labels?.['instantworker.user'] || '',
          skill: info.Labels?.['instantworker.skill'] || '',
          improvements: hasContent ? improvements : null,
        });
      })
    );

    // Separate containers with suggestions from those without
    const withSuggestions = results.filter(r => r.improvements !== null);
    const totalContainers = results.length;

    console.log(`♦ Flywheel harvest: ${withSuggestions.length}/${totalContainers} containers have suggestions`);

    res.json({
      totalContainers,
      containersWithSuggestions: withSuggestions.length,
      suggestions: withSuggestions,
    });
  } catch (err: any) {
    console.error('Improvements harvest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /activity/:id — Read heartbeat/work log from container ───
// Returns recent heartbeat session output so the client can see what the agent did on auto-pilot
containerRoutes.get('/activity/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    const memoryDir = `${CONTAINER_WORKSPACE}/memory`;

    // Read heartbeat log + daily logs + improvement suggestions
    const [heartbeatLog, dailyFiles] = await Promise.all([
      readContainerFile(container, `${memoryDir}/heartbeat-log.md`),
      listContainerFiles(container, memoryDir),
    ]);

    // Read recent daily log files (YYYY-MM-DD.md pattern)
    const dailyLogs = dailyFiles
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse()
      .slice(0, 7); // Last 7 days

    const dailyEntries = await Promise.all(
      dailyLogs.map(async (f) => {
        const content = await readContainerFile(container, `${memoryDir}/${f}`);
        return { date: f.replace('.md', ''), content };
      })
    );

    // Read engagement stats if available
    const engagementStats = await readContainerFile(container, `${memoryDir}/engagement-stats.md`);

    res.json({
      heartbeatLog,
      dailyEntries: dailyEntries.filter(e => e.content),
      engagementStats,
    });
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json({ heartbeatLog: null, dailyEntries: [], engagementStats: null });
    }
    console.error('Activity read error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /status-detail/:id — Detailed status for agent banner ───
containerRoutes.get('/status-detail/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    const info = await container.inspect();

    const gatewayPort = info.HostConfig?.PortBindings?.['18789/tcp']?.[0]?.HostPort;
    const isRunning = info.State.Running;
    const startedAt = info.State.StartedAt;

    // Calculate uptime
    const uptimeMs = isRunning && startedAt ? Date.now() - new Date(startedAt).getTime() : 0;
    const uptimeHours = Math.floor(uptimeMs / 3600000);

    // Check gateway health
    let gatewayHealthy = false;
    if (isRunning && gatewayPort) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const resp = await fetch(`http://localhost:${gatewayPort}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        gatewayHealthy = resp.ok;
      } catch {
        gatewayHealthy = false;
      }
    }

    // Read pending questions from memory (for "needs attention" alerts)
    const pendingQuestions = await readContainerFile(container, `${CONTAINER_WORKSPACE}/memory/pending-questions.md`);
    const hasQuestions = pendingQuestions ? pendingQuestions.split('\n').length > 5 : false;

    // Determine detailed status
    let detailedStatus: string;
    if (!isRunning) {
      detailedStatus = 'offline';
    } else if (!gatewayHealthy) {
      detailedStatus = 'unhealthy';
    } else if (hasQuestions) {
      detailedStatus = 'needs-attention';
    } else {
      detailedStatus = 'healthy';
    }

    res.json({
      status: detailedStatus,
      isRunning,
      uptimeHours,
      gatewayHealthy,
      hasQuestions,
      startedAt: isRunning ? startedAt : null,
      containerState: info.State.Status,
    });
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json({
        status: 'not-found',
        isRunning: false,
        uptimeHours: 0,
        gatewayHealthy: false,
        hasQuestions: false,
        startedAt: null,
        containerState: 'not-found',
      });
    }
    console.error('Status detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /summary/:id — Summary data for employee (stats + knowledge search) ───
containerRoutes.get('/summary/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { q } = req.query; // Optional search query
    const name = containerName(id);
    const container = docker.getContainer(name);

    const memoryDir = `${CONTAINER_WORKSPACE}/memory`;

    // Read all available data in parallel
    const [
      engagementStats,
      improvementSuggestions,
      pendingQuestions,
      researchFindings,
      memoryFiles,
      docFiles,
    ] = await Promise.all([
      readContainerFile(container, `${memoryDir}/engagement-stats.md`),
      readContainerFile(container, `${memoryDir}/improvement-suggestions.md`),
      readContainerFile(container, `${memoryDir}/pending-questions.md`),
      readContainerFile(container, `${memoryDir}/research-findings.md`),
      listContainerFiles(container, memoryDir),
      listContainerFiles(container, DOCS_DIR),
    ]);

    // Parse stats from engagement-stats.md if available
    let stats = {
      commentsToday: 0,
      repliesReceived: 0,
      accountsEngaged: 0,
      postsCreated: 0,
    };
    if (engagementStats) {
      // Try to parse numbers from markdown
      const numMatch = (pattern: RegExp) => {
        const m = engagementStats.match(pattern);
        return m ? parseInt(m[1]) || 0 : 0;
      };
      stats.commentsToday = numMatch(/comments?[:\s]*(\d+)/i);
      stats.repliesReceived = numMatch(/repl(?:y|ies)[:\s]*(\d+)/i);
      stats.accountsEngaged = numMatch(/accounts?[:\s]*(\d+)/i);
      stats.postsCreated = numMatch(/(?:posts?|tweets?|threads?)[:\s]*(\d+)/i);
    }

    // Build knowledge base entries
    const knowledgeEntries: Array<{
      category: string;
      filename: string;
      content: string | null;
    }> = [];

    // Read doc files
    for (const f of docFiles) {
      const content = await readContainerFile(container, `${DOCS_DIR}/${f}`);
      knowledgeEntries.push({ category: 'docs', filename: f, content });
    }

    // Read memory files (skip binary/large)
    for (const f of memoryFiles) {
      if (f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json')) {
        const content = await readContainerFile(container, `${memoryDir}/${f}`);
        knowledgeEntries.push({ category: 'memory', filename: f, content });
      }
    }

    // Apply search filter if query provided
    let filteredKnowledge = knowledgeEntries.filter(e => e.content);
    if (q && typeof q === 'string' && q.trim()) {
      const query = q.trim().toLowerCase();
      filteredKnowledge = filteredKnowledge.filter(e =>
        e.filename.toLowerCase().includes(query) ||
        (e.content && e.content.toLowerCase().includes(query))
      );
    }

    res.json({
      stats,
      issues: {
        pendingQuestions: pendingQuestions ? pendingQuestions.split('\n').filter((l: string) => l.trim()).length : 0,
        improvementCount: improvementSuggestions ? improvementSuggestions.split('\n').filter((l: string) => l.startsWith('- ')).length : 0,
      },
      engagementStats,
      improvementSuggestions,
      researchFindings,
      knowledge: filteredKnowledge.map(e => ({
        category: e.category,
        filename: e.filename,
        preview: e.content ? e.content.slice(0, 300) : '',
        fullContent: e.content,
      })),
    });
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json({
        stats: { commentsToday: 0, repliesReceived: 0, accountsEngaged: 0, postsCreated: 0 },
        issues: { pendingQuestions: 0, improvementCount: 0 },
        engagementStats: null,
        improvementSuggestions: null,
        researchFindings: null,
        knowledge: [],
      });
    }
    console.error('Summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Content Pipeline — queue.json file inside container ───
const CONTENT_QUEUE_PATH = `${CONTAINER_WORKSPACE}/content/queue.json`;

interface ContentItem {
  id: string;
  type: 'comment' | 'tweet' | 'thread' | 'article';
  status: 'draft' | 'pending' | 'approved' | 'posted' | 'rejected';
  content: string;
  target?: string; // target account or hashtag
  platform: string;
  createdAt: string;
  updatedAt: string;
  postedUrl?: string;
  feedback?: string;
}

// ─── GET /content/:id — Read content queue from container ───
containerRoutes.get('/content/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = containerName(id);
    const container = docker.getContainer(name);

    const raw = await readContainerFile(container, CONTENT_QUEUE_PATH);
    if (!raw) {
      return res.json({ items: [] });
    }

    try {
      const data = JSON.parse(raw);
      const items: ContentItem[] = Array.isArray(data) ? data : (data.items || []);
      return res.json({ items });
    } catch {
      return res.json({ items: [] });
    }
  } catch (err: any) {
    if (err.statusCode === 404) {
      return res.json({ items: [] });
    }
    console.error('Content read error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /content/:id/approve — Approve a content item ───
containerRoutes.post('/content/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId required' });

    const name = containerName(id);
    const container = docker.getContainer(name);

    const raw = await readContainerFile(container, CONTENT_QUEUE_PATH);
    if (!raw) return res.status(404).json({ error: 'No content queue' });

    const data = JSON.parse(raw);
    const items: ContentItem[] = Array.isArray(data) ? data : (data.items || []);

    const item = items.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.status = 'approved';
    item.updatedAt = new Date().toISOString();

    const updated = Array.isArray(data) ? items : { ...data, items };
    await writeContainerFile(container, CONTENT_QUEUE_PATH, JSON.stringify(updated, null, 2));

    console.log(`♦ Content item ${itemId} approved in ${name}`);
    res.json({ success: true, item });
  } catch (err: any) {
    console.error('Content approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /content/:id/reject — Reject a content item ───
containerRoutes.post('/content/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId, feedback } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId required' });

    const name = containerName(id);
    const container = docker.getContainer(name);

    const raw = await readContainerFile(container, CONTENT_QUEUE_PATH);
    if (!raw) return res.status(404).json({ error: 'No content queue' });

    const data = JSON.parse(raw);
    const items: ContentItem[] = Array.isArray(data) ? data : (data.items || []);

    const item = items.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.status = 'rejected';
    item.feedback = feedback || '';
    item.updatedAt = new Date().toISOString();

    const updated = Array.isArray(data) ? items : { ...data, items };
    await writeContainerFile(container, CONTENT_QUEUE_PATH, JSON.stringify(updated, null, 2));

    console.log(`♦ Content item ${itemId} rejected in ${name}`);
    res.json({ success: true, item });
  } catch (err: any) {
    console.error('Content reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
