import {
	REALTIME_FALLBACK_SYNC_INTERVAL_MS,
	WS_DEGRADED_THRESHOLD,
	WS_MAX_BACKOFF_MS,
	WS_STALE_TIMEOUT_MS,
} from "../constants/sync";
import type {
	RealtimeMessageKind,
	RealtimeTransport,
	RealtimeTransportCallbacks,
	RealtimeTransportStatus,
} from "./types";

interface WebSocketLike {
	close(): void;
	onclose: ((event: CloseEvent) => void) | null;
	onerror: ((event: Event) => void) | null;
	onmessage: ((event: MessageEvent<unknown>) => void) | null;
	onopen: ((event: Event) => void) | null;
}

interface CreateWebSocketRealtimeTransportOptions
	extends RealtimeTransportCallbacks {
	getUrl: () => string | Promise<string>;
	decodeMessage: (data: unknown) => RealtimeMessageKind | null;
	createSocket?: (url: string) => WebSocketLike;
	random?: () => number;
	maxBackoffMs?: number;
	degradedThreshold?: number;
	staleTimeoutMs?: number;
	fallbackIntervalMs?: number;
}

const BASE_BACKOFF_MS = 1_000;
const HEALTH_CHECK_INTERVAL_MS = 5_000;

export function createWebSocketRealtimeTransport(
	options: CreateWebSocketRealtimeTransportOptions,
): RealtimeTransport {
	const createSocket =
		options.createSocket ?? ((url: string) => new WebSocket(url));
	const random = options.random ?? Math.random;
	const maxBackoffMs = options.maxBackoffMs ?? WS_MAX_BACKOFF_MS;
	const degradedThreshold = options.degradedThreshold ?? WS_DEGRADED_THRESHOLD;
	const staleTimeoutMs = options.staleTimeoutMs ?? WS_STALE_TIMEOUT_MS;
	const fallbackIntervalMs =
		options.fallbackIntervalMs ?? REALTIME_FALLBACK_SYNC_INTERVAL_MS;

	let socket: WebSocketLike | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let healthTimer: ReturnType<typeof setTimeout> | null = null;
	let fallbackTimer: ReturnType<typeof setInterval> | null = null;
	let active = false;
	let status: RealtimeTransportStatus = "idle";
	let backoffMs = BASE_BACKOFF_MS;
	let consecutiveFailures = 0;
	let lastMessageAt = 0;
	const listeners = new Set<(status: RealtimeTransportStatus) => void>();

	function emitStatus(nextStatus: RealtimeTransportStatus) {
		if (status === nextStatus) return;
		status = nextStatus;
		if (status === "degraded") {
			startFallback();
		} else {
			stopFallback();
		}
		for (const listener of listeners) {
			listener(status);
		}
	}

	function clearReconnectTimer() {
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
	}

	function clearHealthTimer() {
		if (healthTimer) {
			clearTimeout(healthTimer);
			healthTimer = null;
		}
	}

	function stopFallback() {
		if (fallbackTimer) {
			clearInterval(fallbackTimer);
			fallbackTimer = null;
		}
	}

	function startFallback() {
		if (fallbackTimer || !active) return;
		fallbackTimer = setInterval(() => {
			options.onNotify();
		}, fallbackIntervalMs);
	}

	function detachSocket() {
		if (!socket) return;
		socket.onopen = null;
		socket.onmessage = null;
		socket.onerror = null;
		socket.onclose = null;
		socket = null;
	}

	function closeSocket() {
		if (!socket) return;
		const current = socket;
		detachSocket();
		current.close();
	}

	function scheduleHealthCheck() {
		clearHealthTimer();
		healthTimer = setTimeout(() => {
			if (!active || !socket) return;
			if (Date.now() - lastMessageAt > staleTimeoutMs) {
				closeSocket();
				handleDisconnect();
				return;
			}
			scheduleHealthCheck();
		}, HEALTH_CHECK_INTERVAL_MS);
	}

	function scheduleReconnect() {
		if (!active) return;
		const jitterFactor = 1 + random() * 0.3;
		const delayMs = Math.round(backoffMs * jitterFactor);
		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			void connect();
		}, delayMs);
		backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
	}

	function handleDisconnect() {
		clearHealthTimer();
		detachSocket();

		if (!active) {
			emitStatus("closed");
			return;
		}

		consecutiveFailures += 1;
		emitStatus(
			consecutiveFailures >= degradedThreshold ? "degraded" : "connecting",
		);
		scheduleReconnect();
	}

	async function connect() {
		if (!active) return;

		clearReconnectTimer();
		emitStatus(
			consecutiveFailures >= degradedThreshold ? "degraded" : "connecting",
		);

		try {
			const url = await options.getUrl();
			if (!active) return;

			const nextSocket = createSocket(url);
			socket = nextSocket;

			nextSocket.onopen = () => {
				lastMessageAt = Date.now();
				backoffMs = BASE_BACKOFF_MS;
				consecutiveFailures = 0;
				emitStatus("open");
				options.onOpen?.();
				scheduleHealthCheck();
			};

			nextSocket.onmessage = (event: MessageEvent<unknown>) => {
				const kind = options.decodeMessage(event.data);
				if (!kind) return;
				lastMessageAt = Date.now();
				if (status === "degraded") {
					emitStatus("open");
				}
				if (kind === "notify") {
					options.onNotify();
				}
				scheduleHealthCheck();
			};

			nextSocket.onerror = () => {
				closeSocket();
				handleDisconnect();
			};

			nextSocket.onclose = () => {
				handleDisconnect();
			};
		} catch {
			handleDisconnect();
		}
	}

	return {
		start() {
			if (active) return;
			active = true;
			backoffMs = BASE_BACKOFF_MS;
			consecutiveFailures = 0;
			void connect();
		},
		stop() {
			active = false;
			backoffMs = BASE_BACKOFF_MS;
			consecutiveFailures = 0;
			clearReconnectTimer();
			clearHealthTimer();
			stopFallback();
			closeSocket();
			emitStatus("closed");
		},
		getStatus() {
			return status;
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	};
}
