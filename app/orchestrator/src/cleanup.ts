import Docker from 'dockerode';

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

// How long to keep stopped containers before removing (7 days)
const STOPPED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cleanup — runs every hour via cron.
 * Removes containers that have been stopped for too long.
 * This frees up disk space and ports.
 */
export async function cleanupExpired(): Promise<void> {
  const containers = await docker.listContainers({
    all: true,
    filters: {
      label: ['instantworker=true'],
      status: ['exited', 'dead'],
    },
  });

  let removed = 0;

  for (const containerInfo of containers) {
    const container = docker.getContainer(containerInfo.Id);
    const name = containerInfo.Names[0]?.replace('/', '') || 'unknown';

    try {
      const info = await container.inspect();
      const finishedAt = new Date(info.State.FinishedAt).getTime();
      const age = Date.now() - finishedAt;

      if (age > STOPPED_RETENTION_MS) {
        console.log(`♦ Cleanup: removing ${name} (stopped ${Math.round(age / 86400000)}d ago)`);
        await container.remove({ force: true });
        removed++;
      }
    } catch (err: any) {
      console.error(`♦ Cleanup: error processing ${name}:`, err.message);
    }
  }

  if (removed > 0) {
    console.log(`♦ Cleanup: removed ${removed} expired container(s)`);
  }

  // Also prune dangling images (free disk space)
  try {
    const pruneResult = await docker.pruneImages({ filters: { dangling: { 'true': true } } });
    const freed = pruneResult.SpaceReclaimed || 0;
    if (freed > 0) {
      console.log(`♦ Cleanup: pruned ${Math.round(freed / 1024 / 1024)}MB of dangling images`);
    }
  } catch {
    // Ignore prune errors
  }
}
