import Docker from 'dockerode';

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

/**
 * Health check — runs every 5 minutes via cron.
 * Checks all InstantWorker containers and restarts any that are unhealthy.
 */
export async function healthCheck(): Promise<void> {
  const containers = await docker.listContainers({
    all: true,
    filters: { label: ['instantworker=true'] },
  });

  let healthy = 0;
  let restarted = 0;
  let stopped = 0;

  for (const containerInfo of containers) {
    const container = docker.getContainer(containerInfo.Id);
    const name = containerInfo.Names[0]?.replace('/', '') || 'unknown';

    if (containerInfo.State === 'running') {
      // Check if the gateway port is responding
      const gatewayPort = containerInfo.Ports.find(p => p.PrivatePort === 18789)?.PublicPort;
      if (gatewayPort) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`http://localhost:${gatewayPort}/health`, {
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (res.ok) {
            healthy++;
            continue;
          }
        } catch {
          // Gateway not responding — might need restart
        }

        // Gateway unresponsive — restart container
        try {
          console.log(`♦ Health: ${name} gateway unresponsive, restarting...`);
          await container.restart({ t: 10 });
          restarted++;
        } catch (err: any) {
          console.error(`♦ Health: failed to restart ${name}:`, err.message);
        }
      } else {
        healthy++; // Running but no gateway port mapped — probably fine
      }
    } else if (containerInfo.State === 'exited') {
      stopped++;
      // Don't auto-restart stopped containers — they may be stopped intentionally
      // (expired trial, cancelled subscription, etc.)
    }
  }

  if (containers.length > 0) {
    console.log(`♦ Health check: ${healthy} healthy, ${restarted} restarted, ${stopped} stopped (${containers.length} total)`);
  }
}
