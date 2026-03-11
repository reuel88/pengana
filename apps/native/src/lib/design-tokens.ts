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

/** Text color for use on primary/accent backgrounds (buttons, badges, etc.) */
export const TEXT_ON_PRIMARY = "#ffffff";

export const PLACEHOLDER_COLORS = {
	light: "#999",
	dark: "#666",
} as const;

export const SYNC_STATUS_COLORS = {
	synced: STATUS_COLORS.success,
	pending: STATUS_COLORS.warning,
	conflict: STATUS_COLORS.error,
} as const;

export { MAX_EVENT_LOG_SIZE, WS_MAX_BACKOFF_MS } from "@pengana/sync-engine";
