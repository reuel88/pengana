import { beforeEach, describe, expect, it, vi } from "vitest";

const { getFileFromDexie } = vi.hoisted(() => ({
	getFileFromDexie: vi.fn(),
}));

vi.mock("./dexie-file-store", () => ({
	getFileFromDexie,
}));

import { createDexieUploadTransport } from "./dexie-upload-transport";

const fakeDb = {} as Parameters<typeof createDexieUploadTransport>[0]["db"];

describe("createDexieUploadTransport", () => {
	beforeEach(() => {
		getFileFromDexie.mockReset();
	});

	it("reads from IndexedDB and uploads the stored base64", async () => {
		const rpc = {
			upload: vi.fn().mockResolvedValue({
				data: { url: "https://cdn.example.com/file.png" },
			}),
		};
		getFileFromDexie.mockResolvedValue({ base64: "YWJj" });

		const transport = createDexieUploadTransport({ rpc, db: fakeDb });

		await transport.upload({
			fileUri: "indexeddb://media-123",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
		});

		expect(getFileFromDexie).toHaveBeenCalledWith(fakeDb, "media-123");
		expect(rpc.upload).toHaveBeenCalledWith({
			fileName: expect.stringMatching(/^attachment-\d+\.png$/),
			mimeType: "image/png",
			data: "YWJj",
			idempotencyKey: "idem-1",
			attachmentId: "idem-1",
		});
	});

	it("forwards standalone scope to the upload rpc", async () => {
		const rpc = {
			upload: vi.fn().mockResolvedValue({
				data: { url: "https://cdn.example.com/file.png" },
			}),
		};
		getFileFromDexie.mockResolvedValue({ base64: "YWJj" });

		const transport = createDexieUploadTransport({ rpc, db: fakeDb });

		await transport.upload({
			fileUri: "indexeddb://media-123",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
			scopeType: "org",
		});

		expect(rpc.upload).toHaveBeenCalledWith(
			expect.objectContaining({
				scopeType: "org",
			}),
		);
	});

	it("throws the storage-specific missing file error", async () => {
		getFileFromDexie.mockResolvedValue(undefined);
		const transport = createDexieUploadTransport({
			rpc: { upload: vi.fn() },
			db: fakeDb,
		});

		await expect(
			transport.upload({
				fileUri: "indexeddb://media-456",
				mimeType: "image/png",
				idempotencyKey: "idem-1",
			}),
		).rejects.toThrow(
			"File not found in storage. It may have been lost. Please re-attach the file.",
		);
	});

	it("does not throw when onFailed is called", async () => {
		const transport = createDexieUploadTransport({
			rpc: { upload: vi.fn() },
			db: fakeDb,
		});

		await expect(transport.onFailed?.("blob:file")).resolves.toBeUndefined();
	});
});
