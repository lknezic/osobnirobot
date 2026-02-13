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
      Cmd: ['cat', filePath],
      AttachStdout: true,
      AttachStderr: true,
    });
    const stream = await exec.start({ Detach: false, Tty: false });
    return new Promise((resolve) => {
      let output = '';
      stream.on('data', (chunk: Buffer) => {
        // Docker exec stream has 8-byte header per frame
        // Skip header bytes for non-tty streams
        output += chunk.toString('utf-8');
      });
      stream.on('end', () => {
        // Clean up docker stream headers (first 8 bytes of each frame)
        const cleaned = output.replace(/[\x00-\x07]/g, '').trim();
        resolve(cleaned || null);
      });
      stream.on('error', () => resolve(null));
    });
  } catch {
    return null;
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

// Container workspace path inside Docker
const CONTAINER_WORKSPACE = '/home/user/.openclaw/workspace';

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

    // Create container
    const container = await docker.createContainer({
      Image: env().CONTAINER_IMAGE,
      name,
      Env: [
        `GATEWAY_TOKEN=${gatewayToken}`,
        `OPENCLAW_GATEWAY_PORT=18789`,
        `NOVNC_PORT=6080`,
        `GOOGLE_AI_KEY=${env().GOOGLE_AI_KEY}`,
        `ANTHROPIC_API_KEY=${env().ANTHROPIC_API_KEY}`,
        `ASSISTANT_NAME=${assistantName || 'Worker'}`,
        `WORKER_TYPE=${workerType || 'general'}`,
      ],
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

    const fileList = files.map(f => ({ name: f }));
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
