import { describe, expect, it, vi } from "vitest";

import { createUploadTransport } from "./upload-transport";

describe("createUploadTransport", () => {
	it("uploads base64 data through the rpc client", async () => {
		const rpc = {
			upload: vi.fn().mockResolvedValue({
				data: { url: "https://cdn.example.com/file.png" },
			}),
		};
		const transport = createUploadTransport({
			rpc,
			getBase64: vi.fn().mockResolvedValue("YWJj"),
		});

		const result = await transport.upload({
			fileUri: "/tmp/file.png",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
		});

		expect(rpc.upload).toHaveBeenCalledWith({
			fileName: expect.stringMatching(/^attachment-\d+\.png$/),
			mimeType: "image/png",
			data: "YWJj",
			idempotencyKey: "idem-1",
			attachmentId: "idem-1",
		});
		expect(result).toEqual({
			url: "https://cdn.example.com/file.png",
		});
	});

	it("passes standalone scope through to the rpc client", async () => {
		const rpc = {
			upload: vi.fn().mockResolvedValue({
				data: { url: "https://cdn.example.com/file.png" },
			}),
		};
		const transport = createUploadTransport({
			rpc,
			getBase64: vi.fn().mockResolvedValue("YWJj"),
		});

		await transport.upload({
			fileUri: "/tmp/file.png",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
			scopeType: "personal",
		});

		expect(rpc.upload).toHaveBeenCalledWith(
			expect.objectContaining({
				scopeType: "personal",
			}),
		);
	});

	it("throws when the file data is missing", async () => {
		const transport = createUploadTransport({
			rpc: { upload: vi.fn() },
			getBase64: vi.fn().mockResolvedValue(""),
		});

		await expect(
			transport.upload({
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
					data: { url: "https://cdn.example.com/file.png" },
				}),
			},
			getBase64: vi.fn().mockResolvedValue("YWJj"),
			onUploaded,
		});

		await transport.upload({
			fileUri: "/tmp/file.png",
			mimeType: "image/png",
			idempotencyKey: "idem-1",
		});

		expect(onUploaded).toHaveBeenCalledWith("/tmp/file.png");
	});

	it("passes through onFailed", async () => {
		const onFailed = vi.fn();
		const transport = createUploadTransport({
			rpc: { upload: vi.fn() },
			getBase64: vi.fn(),
			onFailed,
		});

		await transport.onFailed?.("/tmp/file.png");

		expect(onFailed).toHaveBeenCalledWith("/tmp/file.png");
	});
});
