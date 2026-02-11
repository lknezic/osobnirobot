import { Router, Request, Response } from 'express';
import Docker from 'dockerode';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

const CONTAINER_IMAGE = process.env.CONTAINER_IMAGE || 'instantworker/worker:latest';
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const GATEWAY_PORT_START = parseInt(process.env.GATEWAY_PORT_START || '20000');
const GATEWAY_PORT_END = parseInt(process.env.GATEWAY_PORT_END || '20999');
const NOVNC_PORT_START = parseInt(process.env.NOVNC_PORT_START || '21000');
const NOVNC_PORT_END = parseInt(process.env.NOVNC_PORT_END || '21999');
const WORKER_TEMPLATES_PATH = process.env.WORKER_TEMPLATES_PATH || '/opt/osobnirobot/worker-templates';

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

// ─── Helper: get container name for user ───
function containerName(userId: string): string {
  return `iw-${userId.slice(0, 12)}`;
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
  },
  assistantName: string,
  personality: string
): string {
  // Create a temp directory with the workspace files
  const tmpDir = path.join('/tmp', `iw-workspace-${randomUUID()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // Determine primary skill template to use
  const primarySkill = workerType || 'x-commenter';
  const templateDir = path.join(WORKER_TEMPLATES_PATH, primarySkill);
  const sharedDir = path.join(WORKER_TEMPLATES_PATH, '_shared');

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
    const skillTemplateDir = path.join(WORKER_TEMPLATES_PATH, skillId);
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

  // Create memory directory
  fs.mkdirSync(path.join(tmpDir, 'memory'), { recursive: true });

  return tmpDir;
}

// ─── POST /provision — Create a new container ───
containerRoutes.post('/provision', async (req: Request, res: Response) => {
  try {
    const { userId, assistantName, personality, workerType, workerConfig } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const name = containerName(userId);

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
    const gatewayPort = await findAvailablePort(GATEWAY_PORT_START, GATEWAY_PORT_END);
    const novncPort = await findAvailablePort(NOVNC_PORT_START, NOVNC_PORT_END);
    const gatewayToken = randomUUID();

    // Build workspace from templates
    const workspaceDir = buildWorkspace(
      workerType || 'x-commenter',
      workerConfig || {},
      assistantName || 'Worker',
      personality || ''
    );

    console.log(`♦ Provisioning container ${name}: gateway=${gatewayPort}, novnc=${novncPort}`);

    // Create container
    const container = await docker.createContainer({
      Image: CONTAINER_IMAGE,
      name,
      Env: [
        `GATEWAY_TOKEN=${gatewayToken}`,
        `OPENCLAW_GATEWAY_PORT=18789`,
        `NOVNC_PORT=6080`,
        `GOOGLE_AI_KEY=${GOOGLE_AI_KEY}`,
        `ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}`,
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
        ],
        RestartPolicy: { Name: 'unless-stopped' },
        Memory: 2 * 1024 * 1024 * 1024, // 2GB
        NanoCpus: 2000000000, // 2 CPU cores
        ShmSize: 256 * 1024 * 1024, // 256MB shared memory (needed for Chrome)
      },
      Labels: {
        'instantworker': 'true',
        'instantworker.user': userId,
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

// ─── GET /status/:userId — Get container status ───
containerRoutes.get('/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const name = containerName(userId);

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
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const name = containerName(userId);
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
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const name = containerName(userId);
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

// ─── DELETE /remove/:userId — Remove a container entirely ───
containerRoutes.delete('/remove/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const name = containerName(userId);
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
