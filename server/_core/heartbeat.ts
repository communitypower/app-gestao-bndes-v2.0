export type HeartbeatJobOptions = {
  name: string;
  cron: string;
  path: string;
  description?: string;
};

export async function createHeartbeatJob(
  options: HeartbeatJobOptions,
  sessionToken?: string
): Promise<{ taskUid: string }> {
  console.log("[Heartbeat] Registered scheduled job:", options.name, options.cron, options.path);
  return { taskUid: `hb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
}

export async function updateHeartbeatJob(
  taskUid: string,
  updates: { enable: boolean },
  sessionToken?: string
): Promise<{ taskUid: string; enabled: boolean }> {
  console.log("[Heartbeat] Updated scheduled job:", taskUid, updates);
  return { taskUid, enabled: updates.enable };
}
