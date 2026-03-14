import { describe, expect, it, vi } from "vitest";

import { createUploadTransport } from "./upload-transport";

describe("createUploadTransport", () => {
	it("uploads base64 data through the rpc client", async () => {
		const rpc = {
			upload: vi.fn().mockResolvedValue({
				data: { attachmentUrl: "https://cdn.example.com/file.png" },
			}),
		};
		const transport = createUploadTransport({
			rpc,
			getBase64: vi.fn().mockResolvedValue("YWJj"),
		});

		const result = await transport.upload({
			entityType: "todo",
			entityId: "todo-1",
			fileUri: "/tmp/file.png",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
		});

		expect(rpc.upload).toHaveBeenCalledWith({
			entityType: "todo",
			entityId: "todo-1",
			fileName: expect.stringMatching(/^attachment-\d+\.png$/),
			mimeType: "image/png",
			data: "YWJj",
			idempotencyKey: "idem-1",
		});
		expect(result).toEqual({
			attachmentUrl: "https://cdn.example.com/file.png",
		});
	});

	it("throws when the file data is missing", async () => {
		const transport = createUploadTransport({
			rpc: { upload: vi.fn() },
			getBase64: vi.fn().mockResolvedValue(""),
		});

		await expect(
			transport.upload({
				entityType: "todo",
				entityId: "todo-1",
				fileUri: "/tmp/file.png",
				mimeType: "image/png",
				idempotencyKey: "idem-1",
			}),
		).rejects.toThrow(
			"File not found. It may have been lost. Please re-attach the file.",
		);
	});

	it("calls onUploaded after a successful upload", async () => {
		const onUploaded = vi.fn();
		const transport = createUploadTransport({
			rpc: {
				upload: vi.fn().mockResolvedValue({
					data: { attachmentUrl: "https://cdn.example.com/file.png" },
				}),
			},
			getBase64: vi.fn().mockResolvedValue("YWJj"),
			onUploaded,
		});

		await transport.upload({
			entityType: "todo",
			entityId: "todo-1",
			fileUri: "/tmp/file.png",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
		});

		expect(onUploaded).toHaveBeenCalledWith("todo", "todo-1", "/tmp/file.png");
	});

	it("passes through onFailed", async () => {
		const onFailed = vi.fn();
		const transport = createUploadTransport({
			rpc: { upload: vi.fn() },
			getBase64: vi.fn(),
			onFailed,
		});

		await transport.onFailed?.("todo", "todo-1", "/tmp/file.png");

		expect(onFailed).toHaveBeenCalledWith("todo", "todo-1", "/tmp/file.png");
	});
});
