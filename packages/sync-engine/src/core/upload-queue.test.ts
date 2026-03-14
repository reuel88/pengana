import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	UploadAdapter,
	UploadEvent,
	UploadItem,
	UploadTransport,
} from "../types";
import { UploadQueue } from "./upload-queue";

function makeUploadItem(overrides: Partial<UploadItem> = {}): UploadItem {
	return {
		id: "upload-1",
		entityType: "todo",
		entityId: "todo-1",
		fileUri: "file:///test.jpg",
		mimeType: "image/jpeg",
		status: "queued",
		retryCount: 0,
		createdAt: new Date().toISOString(),
		...overrides,
	};
}

function createMockUploadAdapter(): UploadAdapter {
	return {
		addToQueue: vi.fn().mockResolvedValue(undefined),
		getNextQueued: vi.fn().mockResolvedValue(null),
		updateStatus: vi.fn().mockResolvedValue(undefined),
		updateRetry: vi.fn().mockResolvedValue(undefined),
		markCompleted: vi.fn().mockResolvedValue(undefined),
		markFailed: vi.fn().mockResolvedValue(undefined),
		getQueueItems: vi.fn().mockResolvedValue([]),
		removeItem: vi.fn().mockResolvedValue(undefined),
	};
}

function createMockUploadTransport(): UploadTransport {
	return {
		upload: vi.fn().mockResolvedValue({
			attachmentUrl: "https://cdn.example.com/file.jpg",
		}),
	};
}

describe("UploadQueue", () => {
	let adapter: UploadAdapter;
	let transport: UploadTransport;
	let queue: UploadQueue;

	beforeEach(() => {
		vi.useFakeTimers();
		adapter = createMockUploadAdapter();
		transport = createMockUploadTransport();
		queue = new UploadQueue(adapter, transport, {
			maxRetries: 3,
			baseBackoffMs: 10,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("enqueue adds item to adapter and triggers processQueue", async () => {
		await queue.enqueue({
			id: "u1",
			entityType: "todo",
			entityId: "t1",
			fileUri: "file:///a.jpg",
			mimeType: "image/jpeg",
		});

		expect(adapter.addToQueue).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "u1",
				entityType: "todo",
				entityId: "t1",
				status: "queued",
				retryCount: 0,
			}),
		);
	});

	it("processQueue processes items until queue empty", async () => {
		const item1 = makeUploadItem({ id: "u1" });
		const item2 = makeUploadItem({ id: "u2" });
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item1)
			.mockResolvedValueOnce(item2)
			.mockResolvedValueOnce(null);

		await queue.processQueue();

		expect(adapter.markCompleted).toHaveBeenCalledTimes(2);
	});

	it("sets status to uploading before upload", async () => {
		const item = makeUploadItem({ id: "u1" });
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item)
			.mockResolvedValueOnce(null);

		await queue.processQueue();

		expect(adapter.updateStatus).toHaveBeenCalledWith("u1", "uploading");
	});

	it("successful upload calls markCompleted with attachment URL", async () => {
		const item = makeUploadItem({ id: "u1" });
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item)
			.mockResolvedValueOnce(null);
		vi.mocked(transport.upload).mockResolvedValue({
			attachmentUrl: "https://cdn.example.com/result.jpg",
		});

		await queue.processQueue();

		expect(adapter.markCompleted).toHaveBeenCalledWith(
			"u1",
			"https://cdn.example.com/result.jpg",
		);
	});

	it("failed upload retries with exponential backoff", async () => {
		const item = makeUploadItem({ id: "u1", retryCount: 0 });
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item)
			.mockResolvedValueOnce(null);
		vi.mocked(transport.upload).mockRejectedValueOnce(new Error("fail"));

		const processPromise = queue.processQueue();
		// Advance timers to resolve the backoff setTimeout
		await vi.advanceTimersByTimeAsync(100);
		await processPromise;

		expect(adapter.updateRetry).toHaveBeenCalledWith("u1", 1);
		expect(adapter.updateStatus).toHaveBeenCalledWith("u1", "queued");
	});

	it("marks item as failed after exhausting maxRetries", async () => {
		const item = makeUploadItem({ id: "u1", retryCount: 2 });
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item)
			.mockResolvedValueOnce(null);
		vi.mocked(transport.upload).mockRejectedValueOnce(new Error("fail"));

		await queue.processQueue();

		expect(adapter.markFailed).toHaveBeenCalledWith("u1");
		const errorEvents: UploadEvent[] = [];
		// Re-test with event capture
		const queue2 = new UploadQueue(adapter, transport, {
			maxRetries: 3,
			baseBackoffMs: 10,
		});
		queue2.onEvent((e) => errorEvents.push(e));
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(makeUploadItem({ id: "u2", retryCount: 2 }))
			.mockResolvedValueOnce(null);
		vi.mocked(transport.upload).mockRejectedValueOnce(new Error("fail"));

		await queue2.processQueue();

		expect(
			errorEvents.some(
				(e) => e.type === "upload:error" && e.detail.includes("3 attempts"),
			),
		).toBe(true);
	});

	it("pause() stops queue processing", async () => {
		queue.pause();

		const item = makeUploadItem();
		vi.mocked(adapter.getNextQueued).mockResolvedValueOnce(item);

		await queue.processQueue();

		expect(adapter.getNextQueued).not.toHaveBeenCalled();
	});

	it("resume() restarts processing", async () => {
		queue.pause();

		const item = makeUploadItem({ id: "u1" });
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item)
			.mockResolvedValueOnce(null);

		queue.resume();
		// Wait for the async processQueue triggered by resume
		await vi.advanceTimersByTimeAsync(0);

		expect(adapter.markCompleted).toHaveBeenCalled();
	});

	it("isProcessing reflects current state", async () => {
		expect(queue.isProcessing).toBe(false);

		let resolveUpload!: (value: { attachmentUrl: string }) => void;
		vi.mocked(transport.upload).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveUpload = resolve;
				}),
		);
		const item = makeUploadItem();
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item)
			.mockResolvedValueOnce(null);

		const processPromise = queue.processQueue();
		// Let microtasks settle so processQueue starts
		await vi.advanceTimersByTimeAsync(0);
		expect(queue.isProcessing).toBe(true);

		resolveUpload({ attachmentUrl: "https://cdn.example.com/f.jpg" });
		await processPromise;
		expect(queue.isProcessing).toBe(false);
	});

	it("retry() resets status and retryCount", async () => {
		await queue.retry("u1");

		expect(adapter.updateStatus).toHaveBeenCalledWith("u1", "queued");
		expect(adapter.updateRetry).toHaveBeenCalledWith("u1", 0);
	});

	it("emits upload:start and upload:complete events", async () => {
		const events: UploadEvent[] = [];
		queue.onEvent((e) => events.push(e));

		const item = makeUploadItem({
			id: "u1",
			entityType: "todo",
			entityId: "t1",
		});
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item)
			.mockResolvedValueOnce(null);

		await queue.processQueue();

		const types = events.map((e) => e.type);
		expect(types).toContain("upload:start");
		expect(types).toContain("upload:complete");
	});

	it("uses item.id as idempotencyKey", async () => {
		const item = makeUploadItem({ id: "unique-id-123" });
		vi.mocked(adapter.getNextQueued)
			.mockResolvedValueOnce(item)
			.mockResolvedValueOnce(null);

		await queue.processQueue();

		expect(transport.upload).toHaveBeenCalledWith(
			expect.objectContaining({ idempotencyKey: "unique-id-123" }),
		);
	});
});
