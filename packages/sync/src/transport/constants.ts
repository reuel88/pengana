/** WebSocket reconnection backoff cap in ms */
export const WS_MAX_BACKOFF_MS = 30_000;

/** Failed reconnect attempts before realtime enters degraded mode */
export const WS_DEGRADED_THRESHOLD = 3;

/** Max time without a realtime message before the socket is recycled */
export const WS_STALE_TIMEOUT_MS = 75_000;

/** Foreground polling cadence while realtime transport is degraded */
export const REALTIME_FALLBACK_SYNC_INTERVAL_MS = 15_000;
