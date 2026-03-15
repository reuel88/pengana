import { beforeEach, describe, expect, it, vi } from "vitest";

const { getFileFromIndexedDB } = vi.hoisted(() => ({
	getFileFromIndexedDB: vi.fn(),
}));

vi.mock("./dexie-file-store", () => ({
	getFileFromIndexedDB,
}));

import { createIndexedDbUploadTransport } from "./indexeddb-upload-transport";

const fakeDb = {} as Parameters<typeof createIndexedDbUploadTransport>[0]["db"];

describe("createIndexedDbUploadTransport", () => {
	beforeEach(() => {
		getFileFromIndexedDB.mockReset();
	});

	it("reads from IndexedDB and uploads the stored base64", async () => {
		const rpc = {
			upload: vi.fn().mockResolvedValue({
				data: { url: "https://cdn.example.com/file.png" },
			}),
		};
		getFileFromIndexedDB.mockResolvedValue({ base64: "YWJj" });

		const transport = createIndexedDbUploadTransport({ rpc, db: fakeDb });

		await transport.upload({
			entityType: "todo",
			entityId: "todo-1",
			fileUri: "indexeddb://media-123",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
		});

		expect(getFileFromIndexedDB).toHaveBeenCalledWith(fakeDb, "media-123");
		expect(rpc.upload).toHaveBeenCalledWith({
			entityType: "todo",
			entityId: "todo-1",
			fileName: expect.stringMatching(/^attachment-\d+\.png$/),
			mimeType: "image/png",
			data: "YWJj",
			idempotencyKey: "idem-1",
			attachmentId: "idem-1",
		});
	});

	it("throws the storage-specific missing file error", async () => {
		getFileFromIndexedDB.mockResolvedValue(undefined);
		const transport = createIndexedDbUploadTransport({
			rpc: { upload: vi.fn() },
			db: fakeDb,
		});

		await expect(
			transport.upload({
				entityType: "todo",
				entityId: "todo-1",
				fileUri: "indexeddb://media-456",
				mimeType: "image/png",
				idempotencyKey: "idem-1",
			}),
		).rejects.toThrow(
			"File not found in storage. It may have been lost. Please re-attach the file.",
		);
	});

	it("does not throw when onFailed is called", async () => {
		const transport = createIndexedDbUploadTransport({
			rpc: { upload: vi.fn() },
			db: fakeDb,
		});

		await expect(
			transport.onFailed?.("todo", "todo-1", "blob:file"),
		).resolves.toBeUndefined();
	});
});
