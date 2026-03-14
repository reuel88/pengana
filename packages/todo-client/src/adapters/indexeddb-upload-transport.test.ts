import { beforeEach, describe, expect, it, vi } from "vitest";

const { getFileFromIndexedDB, removeFileFromIndexedDB } = vi.hoisted(() => ({
	getFileFromIndexedDB: vi.fn(),
	removeFileFromIndexedDB: vi.fn(),
}));

vi.mock("./dexie-file-store", () => ({
	getFileFromIndexedDB,
	removeFileFromIndexedDB,
}));

import { createIndexedDbUploadTransport } from "./indexeddb-upload-transport";

const fakeDb = {} as Parameters<typeof createIndexedDbUploadTransport>[0]["db"];

describe("createIndexedDbUploadTransport", () => {
	beforeEach(() => {
		getFileFromIndexedDB.mockReset();
		removeFileFromIndexedDB.mockReset();
	});

	it("reads from IndexedDB and uploads the stored base64", async () => {
		const rpc = {
			upload: vi.fn().mockResolvedValue({
				data: { attachmentUrl: "https://cdn.example.com/file.png" },
			}),
		};
		getFileFromIndexedDB.mockResolvedValue({ base64: "YWJj" });

		const transport = createIndexedDbUploadTransport({ rpc, db: fakeDb });

		await transport.upload({
			entityType: "todo",
			entityId: "todo-1",
			fileUri: "blob:file",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
		});

		expect(getFileFromIndexedDB).toHaveBeenCalledWith(fakeDb, "todo-1");
		expect(rpc.upload).toHaveBeenCalledWith({
			entityType: "todo",
			entityId: "todo-1",
			fileName: expect.stringMatching(/^attachment-\d+\.png$/),
			mimeType: "image/png",
			data: "YWJj",
			idempotencyKey: "idem-1",
		});
		expect(removeFileFromIndexedDB).toHaveBeenCalledWith(fakeDb, "todo-1");
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
				fileUri: "blob:file",
				mimeType: "image/png",
				idempotencyKey: "idem-1",
			}),
		).rejects.toThrow(
			"File not found in storage. It may have been lost. Please re-attach the file.",
		);
	});

	it("removes the stored file when upload fails permanently", async () => {
		const transport = createIndexedDbUploadTransport({
			rpc: { upload: vi.fn() },
			db: fakeDb,
		});

		await transport.onFailed?.("todo", "todo-1", "blob:file");

		expect(removeFileFromIndexedDB).toHaveBeenCalledWith(fakeDb, "todo-1");
	});
});
