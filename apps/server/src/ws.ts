import type { IncomingMessage } from "node:http";
import type { ServerType } from "@hono/node-server";
import type { WsMessage } from "@pengana/api/ws-types";
import { auth } from "@pengana/auth";
import { WebSocket, WebSocketServer } from "ws";
import { wsLogger } from "./logger";

const PING_INTERVAL_MS = 30_000;
const MAX_CONNECTIONS_PER_USER = 5;
const WS_CLOSE_TRY_AGAIN_LATER = 1013;

export function setupWebSocket(server: ServerType) {
	const connections = new Map<string, Set<WebSocket>>();
	const wss = new WebSocketServer({ noServer: true });

	server.on("upgrade", async (req, socket, head) => {
		const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

		if (url.pathname !== "/ws") {
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

		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit("connection", ws, req, userId);
		});
	});

	wss.on(
		"connection",
		(ws: WebSocket, _req: IncomingMessage, userId: string) => {
			const userSockets = connections.get(userId) ?? new Set<WebSocket>();
			connections.set(userId, userSockets);

			if (userSockets.size >= MAX_CONNECTIONS_PER_USER) {
				wsLogger.warn`Rejected connection for user ${userId} (max connections reached)`;
				ws.close(WS_CLOSE_TRY_AGAIN_LATER, "Too many connections");
				return;
			}

			userSockets.add(ws);
			wsLogger.info`Connection accepted for user ${userId} (${String(userSockets.size)} total)`;

			ws.on("close", () => {
				userSockets.delete(ws);
				wsLogger.info`Connection closed for user ${userId} (${String(userSockets.size)} remaining)`;
				if (userSockets.size === 0) {
					connections.delete(userId);
				}
			});

			ws.on("error", () => {
				ws.close();
			});
		},
	);

	const pingInterval = setInterval(() => {
		for (const sockets of connections.values()) {
			for (const ws of sockets) {
				if (ws.readyState === WebSocket.OPEN) {
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
			wsLogger.debug`notifyUser(${userId}): no connections found`;
			return;
		}

		const payload: WsMessage = { type: "sync-notify" };
		const message = JSON.stringify(payload);
		let sentCount = 0;
		for (const ws of sockets) {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(message);
				sentCount++;
			}
		}
		wsLogger.debug`notifyUser(${userId}): sent to ${String(sentCount)}/${String(sockets.size)} sockets`;
	}

	return { notifyUser };
}

async function authenticateRequest(
	req: IncomingMessage,
	url: URL,
): Promise<string | null> {
	try {
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value) {
				headers.set(key, Array.isArray(value) ? value.join(", ") : value);
			}
		}

		// Native clients pass cookies as a query param since WebSocket
		// on React Native doesn't send cookies automatically
		const cookieParam = url.searchParams.get("cookie");
		if (cookieParam) {
			headers.set("cookie", cookieParam);
		}

		const session = await auth.api.getSession({ headers });
		return session?.user?.id ?? null;
	} catch {
		return null;
	}
}
