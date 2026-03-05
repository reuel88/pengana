import type { IncomingMessage } from "node:http";
import { auth } from "@finance-tool-poc/auth";
import type { ServerType } from "@hono/node-server";
import { WebSocket, WebSocketServer } from "ws";

const PING_INTERVAL_MS = 30_000;
const MAX_CONNECTIONS_PER_USER = 5;

const connections = new Map<string, Set<WebSocket>>();

let wss: WebSocketServer;

export function setupWebSocket(server: ServerType) {
	wss = new WebSocketServer({ noServer: true });

	server.on("upgrade", async (req, socket, head) => {
		const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

		if (url.pathname !== "/ws") {
			socket.destroy();
			return;
		}

		const userId = await authenticateRequest(req, url);
		if (!userId) {
			console.log("[ws] auth failed for upgrade request");
			socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit("connection", ws, req, userId);
		});
	});

	wss.on("connection", handleConnection);

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
}

function handleConnection(
	ws: WebSocket,
	_req: IncomingMessage,
	userId: string,
) {
	const userSockets = connections.get(userId) ?? new Set<WebSocket>();
	connections.set(userId, userSockets);

	if (userSockets.size >= MAX_CONNECTIONS_PER_USER) {
		console.log(
			`[ws] rejected connection for user ${userId} (max connections reached)`,
		);
		ws.close(1013, "Too many connections");
		return;
	}

	userSockets.add(ws);
	console.log(
		`[ws] connection accepted for user ${userId} (${userSockets.size} total)`,
	);

	ws.on("close", () => {
		userSockets.delete(ws);
		console.log(
			`[ws] connection closed for user ${userId} (${userSockets.size} remaining)`,
		);
		if (userSockets.size === 0) {
			connections.delete(userId);
		}
	});

	ws.on("error", () => {
		ws.close();
	});
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

export function notifyUser(userId: string) {
	const sockets = connections.get(userId);
	if (!sockets) {
		console.log(`[ws] notifyUser(${userId}): no connections found`);
		return;
	}

	const openCount = [...sockets].filter(
		(ws) => ws.readyState === WebSocket.OPEN,
	).length;
	console.log(
		`[ws] notifyUser(${userId}): sending to ${openCount}/${sockets.size} sockets`,
	);

	const message = JSON.stringify({ type: "sync-notify" });
	for (const ws of sockets) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	}
}
