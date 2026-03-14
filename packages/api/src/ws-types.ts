export const WS_PATH = "/ws";

export type WsMessage =
	| { type: "connected" }
	| { type: "keepalive" }
	| { type: "sync-notify" };

function decodeWsMessageData(data: unknown): string | null {
	if (typeof data === "string") {
		return data;
	}

	if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
		return data.toString("utf8");
	}

	if (data instanceof Uint8Array) {
		return new TextDecoder().decode(data);
	}

	if (data instanceof ArrayBuffer) {
		return new TextDecoder().decode(new Uint8Array(data));
	}

	if (typeof Blob !== "undefined" && data instanceof Blob) {
		return null;
	}

	return null;
}

export function parseWsMessage(data: unknown): WsMessage | null {
	try {
		const decoded = decodeWsMessageData(data);
		if (!decoded) {
			return null;
		}

		const parsed = JSON.parse(decoded) as { type?: string };

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
