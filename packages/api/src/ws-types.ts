export const WS_PATH = "/ws";

export type WsMessage =
	| { type: "connected" }
	| { type: "keepalive" }
	| { type: "sync-notify" };

export function parseWsMessage(data: unknown): WsMessage | null {
	try {
		const parsed = JSON.parse(
			typeof data === "string" ? data : String(data),
		) as { type?: string };

		if (
			parsed.type === "connected" ||
			parsed.type === "keepalive" ||
			parsed.type === "sync-notify"
		) {
			return { type: parsed.type };
		}
		return null;
	} catch {
		return null;
	}
}
