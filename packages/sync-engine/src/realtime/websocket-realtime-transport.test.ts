import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWebSocketRealtimeTransport } from "./websocket-realtime-transport";

class FakeSocket {
	public onopen: (() => void) | null = null;
	public onmessage: ((event: { data: unknown }) => void) | null = null;
	public onerror: (() => void) | null = null;
	public onclose: (() => void) | null = null;
	public close = vi.fn(() => {
		this.onclose?.();
	});

	emitOpen() {
		this.onopen?.();
	}

	emitMessage(data: unknown) {
		this.onmessage?.({ data });
	}

	emitError() {
		this.onerror?.();
	}

	emitClose() {
		this.onclose?.();
	}
}

describe("createWebSocketRealtimeTransport", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("opens the socket, emits open status, and notifies on sync messages", async () => {
		const socket = new FakeSocket();
		const onNotify = vi.fn();
		const onOpen = vi.fn();
		const statuses: string[] = [];

		const transport = createWebSocketRealtimeTransport({
			getUrl: () => "wss://example.test/ws",
			createSocket: () => socket,
			decodeMessage: (data) => {
				const parsed = JSON.parse(String(data)) as { type?: string };
				if (parsed.type === "sync-notify") return "notify";
				if (parsed.type === "connected" || parsed.type === "keepalive") {
					return "heartbeat";
				}
				return null;
			},
			onNotify,
			onOpen,
			random: () => 0,
		});

		transport.subscribe((status) => statuses.push(status));
		transport.start();
		await vi.runAllTimersAsync();

		socket.emitOpen();
		socket.emitMessage(JSON.stringify({ type: "connected" }));
		socket.emitMessage(JSON.stringify({ type: "sync-notify" }));

		expect(statuses).toEqual(["connecting", "open"]);
		expect(onOpen).toHaveBeenCalledTimes(1);
		expect(onNotify).toHaveBeenCalledTimes(1);
		expect(transport.getStatus()).toBe("open");
	});

	it("enters degraded mode after repeated failures and polls while reconnecting", async () => {
		const sockets: FakeSocket[] = [];
		const onNotify = vi.fn();
		const statuses: string[] = [];

		const transport = createWebSocketRealtimeTransport({
			getUrl: () => "wss://example.test/ws",
			createSocket: () => {
				const socket = new FakeSocket();
				sockets.push(socket);
				return socket;
			},
			decodeMessage: () => null,
			onNotify,
			random: () => 0,
			degradedThreshold: 3,
			fallbackIntervalMs: 1_000,
		});

		transport.subscribe((status) => statuses.push(status));
		transport.start();
		await vi.runAllTimersAsync();

		sockets[0]?.emitError();
		await vi.advanceTimersByTimeAsync(1_000);
		sockets[1]?.emitError();
		await vi.advanceTimersByTimeAsync(2_000);
		sockets[2]?.emitError();
		await vi.advanceTimersByTimeAsync(1_000);

		expect(transport.getStatus()).toBe("degraded");
		expect(statuses).toContain("degraded");

		await vi.advanceTimersByTimeAsync(1_000);
		expect(onNotify).toHaveBeenCalled();
	});

	it("recycles stale sockets that stop receiving keepalives", async () => {
		const sockets: FakeSocket[] = [];

		const transport = createWebSocketRealtimeTransport({
			getUrl: () => "wss://example.test/ws",
			createSocket: () => {
				const socket = new FakeSocket();
				sockets.push(socket);
				return socket;
			},
			decodeMessage: (data) => {
				const parsed = JSON.parse(String(data)) as { type?: string };
				if (parsed.type === "connected" || parsed.type === "keepalive") {
					return "heartbeat";
				}
				return null;
			},
			onNotify: vi.fn(),
			random: () => 0,
			staleTimeoutMs: 10_000,
		});

		transport.start();
		await vi.runAllTimersAsync();
		sockets[0]?.emitOpen();
		sockets[0]?.emitMessage(JSON.stringify({ type: "connected" }));

		await vi.advanceTimersByTimeAsync(16_000);

		expect(sockets[0]?.close).toHaveBeenCalledTimes(1);
		expect(sockets.length).toBeGreaterThanOrEqual(2);
	});

	it("resets failure tracking after a healthy open", async () => {
		const sockets: FakeSocket[] = [];

		const transport = createWebSocketRealtimeTransport({
			getUrl: () => "wss://example.test/ws",
			createSocket: () => {
				const socket = new FakeSocket();
				sockets.push(socket);
				return socket;
			},
			decodeMessage: (data) => {
				const parsed = JSON.parse(String(data)) as { type?: string };
				if (parsed.type === "connected" || parsed.type === "keepalive") {
					return "heartbeat";
				}
				return null;
			},
			onNotify: vi.fn(),
			random: () => 0,
			degradedThreshold: 3,
		});

		transport.start();
		await vi.runAllTimersAsync();

		sockets[0]?.emitError();
		await vi.advanceTimersByTimeAsync(1_000);
		sockets[1]?.emitError();
		await vi.advanceTimersByTimeAsync(2_000);

		sockets[2]?.emitOpen();
		sockets[2]?.emitMessage(JSON.stringify({ type: "connected" }));
		sockets[2]?.emitClose();
		await vi.advanceTimersByTimeAsync(1_000);

		expect(transport.getStatus()).toBe("connecting");
	});
});
