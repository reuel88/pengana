import type { IncomingMessage } from "node:http";
import type { ServerType } from "@hono/node-server";
import { WS_PATH, type WsMessage } from "@pengana/api/ws-types";
import { auth } from "@pengana/auth";
import { WebSocket, WebSocketServer } from "ws";
import { wsLogger } from "./logger";
import { redeemWsTicket } from "./ws-tickets";

const PING_INTERVAL_MS = 30_000;
const MAX_CONNECTIONS_PER_USER = 5;

function redactId(id: string): string {
	if (id.length <= 8) return "***";
	return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function sendMessage(ws: WebSocket, payload: WsMessage): boolean {
	if (ws.readyState !== WebSocket.OPEN) return false;
	ws.send(JSON.stringify(payload));
	return true;
}

async function authenticateRequest(
	req: IncomingMessage,
	url: URL,
): Promise<string | null> {
	// Preferred: one-time ticket (avoids exposing session cookies in URLs)
	const ticket = url.searchParams.get("ticket");
	if (ticket) {
		const userId = redeemWsTicket(ticket);
		if (userId) return userId;
		wsLogger.debug`Invalid or expired WebSocket ticket`;
		return null;
	}

	try {
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value) {
				headers.set(key, Array.isArray(value) ? value.join(", ") : value);
			}
		}

		const session = await auth.api.getSession({ headers });
		return session?.user?.id ?? null;
	} catch (error) {
		wsLogger.debug`authenticateRequest failed: ${error}`;
		return null;
	}
}

export function setupWebSocket(server: ServerType) {
	const connections = new Map<string, Set<WebSocket>>();
	const wss = new WebSocketServer({ noServer: true });
	const aliveSet = new WeakSet<WebSocket>();

	function handleConnection(ws: WebSocket, userId: string) {
		const existing = connections.get(userId);
		const sockets = existing ?? new Set<WebSocket>();
		if (!existing) connections.set(userId, sockets);
		sockets.add(ws);
		aliveSet.add(ws);
		wsLogger.info`Connection accepted for user ${redactId(userId)} (${String(sockets.size)} total)`;

		ws.on("pong", () => {
			aliveSet.add(ws);
		});

		ws.on("close", () => {
			sockets.delete(ws);
			wsLogger.info`Connection closed for user ${redactId(userId)} (${String(sockets.size)} remaining)`;
			if (sockets.size === 0) {
				connections.delete(userId);
			}
		});

		ws.on("error", () => {
			ws.close();
		});

		sendMessage(ws, { type: "connected" });
	}

	server.on("upgrade", async (req, socket, head) => {
		const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

		if (url.pathname !== WS_PATH) {
			socket.destroy();
			return;
		}

		const userId = await authenticateRequest(req, url);
		if (!userId) {
			wsLogger.warn`Auth failed for upgrade request`;
			socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
			socket.destroy();
			return;
		}

		const userSockets = connections.get(userId);
		if (userSockets && userSockets.size >= MAX_CONNECTIONS_PER_USER) {
			wsLogger.warn`Rejected connection for user ${redactId(userId)} (max connections reached)`;
			socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit("connection", ws, req, userId);
		});
	});

	wss.on(
		"connection",
		(ws: WebSocket, _req: IncomingMessage, userId: string) => {
			handleConnection(ws, userId);
		},
	);

	const pingInterval = setInterval(() => {
		for (const sockets of connections.values()) {
			for (const ws of sockets) {
				if (!aliveSet.has(ws)) {
					wsLogger.debug`Terminating dead connection`;
					ws.terminate();
					continue;
				}
				aliveSet.delete(ws);
				if (ws.readyState === WebSocket.OPEN) {
					sendMessage(ws, { type: "keepalive" });
					ws.ping();
				}
			}
		}
	}, PING_INTERVAL_MS);

	wss.on("close", () => {
		clearInterval(pingInterval);
	});

	function notifyUser(userId: string) {
		const sockets = connections.get(userId);
		if (!sockets) {
			wsLogger.debug`notifyUser(${redactId(userId)}): no connections found`;
			return;
		}

		const payload: WsMessage = { type: "sync-notify" };
		let sentCount = 0;
		for (const ws of sockets) {
			if (sendMessage(ws, payload)) sentCount++;
		}
		wsLogger.debug`notifyUser(${redactId(userId)}): sent to ${String(sentCount)}/${String(sockets.size)} sockets`;
	}

	// Cached dynamic import avoids a circular dependency: db -> auth -> ws -> db
	let seatQueriesPromise: Promise<
		typeof import("@pengana/db/seat-queries")
	> | null = null;

	async function notifyOrgMembers(orgId: string) {
		try {
			seatQueriesPromise ??= import("@pengana/db/seat-queries");
			const { getSeatedMemberUserIds } = await seatQueriesPromise;
			const memberUserIds = await getSeatedMemberUserIds(orgId);
			for (const uid of memberUserIds) {
				notifyUser(uid);
			}
		} catch (error) {
			wsLogger.error`notifyOrgMembers failed for org ${redactId(orgId)}: ${error}`;
		}
	}

	return { notifyUser, notifyOrgMembers };
}
