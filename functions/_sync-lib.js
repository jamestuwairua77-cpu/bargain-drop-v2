export async function appendSyncLog(env, entry) {
  try {
    const now = Date.now();
    // Throttle to one write per 60s (fast path guard) to stop the runaway
    // "sync: append log entry" commit flood from CJ redelivery bursts.
    if (now - _lastSyncLogWrite < SYNC_LOG_MIN_INTERVAL_MS) return;
    const existing = await ghRead(env, SYNC_LOG_PATH);
    let log = [];
    let latestAt = 0;
    if (existing && existing.content) {
      const decoded = atob(existing.content);
      try {
        log = JSON.parse(decoded);
        if (Array.isArray(log) && log.length && log[0] && log[0].at) latestAt = new Date(log[0].at).getTime() || 0;
      } catch {}
    }
    if (now - latestAt < SYNC_LOG_MIN_INTERVAL_MS) { _lastSyncLogWrite = now; return; }
    log.unshift({ ...entry, at: new Date().toISOString() });
    await ghWrite(env, SYNC_LOG_PATH, JSON.stringify(log.slice(0, 200), null, 2),
      'sync: append log entry', existing?.sha);
    _lastSyncLogWrite = now;
  } catch (e) {
    console.error('appendSyncLog failed:', e.message);
  }
}
