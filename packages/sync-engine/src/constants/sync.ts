/** Max number of sync/upload events kept in devtools log */
export const MAX_EVENT_LOG_SIZE = 99;

/** WebSocket reconnection backoff cap in ms */
export const WS_MAX_BACKOFF_MS = 30_000;

/** Storage usage ratio at which auto-cleanup runs silently */
export const STORAGE_WARNING_RATIO = 0.8;

/** Storage usage ratio at which a persistent user-facing warning appears */
export const STORAGE_CRITICAL_RATIO = 0.95;
