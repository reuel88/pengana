/** Max number of sync/upload events kept in devtools log */
export const MAX_EVENT_LOG_SIZE = 99;

/** WebSocket reconnection backoff cap in ms */
export const WS_MAX_BACKOFF_MS = 30_000;

/** Failed reconnect attempts before realtime enters degraded mode */
export const WS_DEGRADED_THRESHOLD = 3;

/** Max time without a realtime message before the socket is recycled */
export const WS_STALE_TIMEOUT_MS = 75_000;

/** Foreground polling cadence while realtime transport is degraded */
export const REALTIME_FALLBACK_SYNC_INTERVAL_MS = 15_000;

/** Storage usage ratio at which auto-cleanup runs silently */
export const STORAGE_WARNING_RATIO = 0.8;

/** Storage usage ratio at which a persistent user-facing warning appears */
export const STORAGE_CRITICAL_RATIO = 0.95;
