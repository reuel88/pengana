export const STATUS_COLORS = {
	success: "#22c55e",
	warning: "#eab308",
	error: "#ef4444",
	connected: "#10b981",
} as const;

export const BANNER_COLORS = {
	onlineBg: "rgba(34, 197, 94, 0.1)",
	offlineBg: "rgba(239, 68, 68, 0.1)",
	onlineTextLight: "#16a34a",
	onlineTextDark: "#4ade80",
	offlineTextLight: "#dc2626",
	offlineTextDark: "#f87171",
} as const;

export const PLACEHOLDER_COLORS = {
	light: "#999",
	dark: "#666",
} as const;

export const SYNC_STATUS_COLORS = {
	synced: STATUS_COLORS.success,
	pending: STATUS_COLORS.warning,
	conflict: STATUS_COLORS.error,
} as const;

export const SYNC_STATUS_LABELS = {
	synced: "Synced",
	pending: "Pending sync",
	conflict: "Conflict",
} as const;

/** Max number of sync/upload events kept in devtools log */
export const MAX_EVENT_LOG_SIZE = 99;

/** WebSocket reconnection backoff cap in ms */
export const WS_MAX_BACKOFF_MS = 30_000;
