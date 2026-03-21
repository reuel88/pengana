import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/db", () => ({
	appDb: {},
}));

vi.mock("@/features/upload-queue", () => ({
	createDexieUploadTransport: () => ({}),
}));

const { createNoopRealtimeTransport } = await import("./platform-deps");

describe("createNoopRealtimeTransport", () => {
	it("start() does not throw", () => {
		const transport = createNoopRealtimeTransport();
		expect(() => transport.start()).not.toThrow();
	});

	it("stop() does not throw", () => {
		const transport = createNoopRealtimeTransport();
		expect(() => transport.stop()).not.toThrow();
	});

	it("getStatus() returns 'idle'", () => {
		const transport = createNoopRealtimeTransport();
		expect(transport.getStatus()).toBe("idle");
	});

	it("subscribe() returns an unsubscribe function", () => {
		const transport = createNoopRealtimeTransport();
		const unsubscribe = transport.subscribe(() => {});
		expect(typeof unsubscribe).toBe("function");
		expect(() => unsubscribe()).not.toThrow();
	});
});
