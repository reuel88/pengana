import { describe, expect, it } from "vitest";

import type { LocalMedia, LocalMediaAttachment } from "./db";
import { mergeMediaRecords } from "./merge-media";

const localMediaRecord: LocalMedia = {
	id: "media-1",
	userId: "user-1",
	url: null,
	localUri: "indexeddb://media-1",
	status: "uploading",
	mimeType: "image/png",
	createdAt: "2026-03-18T10:00:00.000Z",
	updatedAt: "2026-03-18T10:00:00.000Z",
	scopeType: "personal",
	scopeId: "user-1",
	organizationId: "",
	createdBy: "user-1",
	hlcTimestamp: "",
	fieldClocks: "{}",
	syncStatus: "synced",
	deleted: false,
};

const attachment: LocalMediaAttachment = {
	id: "att-1",
	mediaId: "media-1",
	entityType: "todo",
	entityId: "todo-1",
	position: 0,
	createdAt: "2026-03-18T10:00:00.000Z",
};

describe("mergeMediaRecords", () => {
	it("includes local-only media and preserves local status", () => {
		const result = mergeMediaRecords({
			localMedia: [localMediaRecord],
			localAttachments: [],
			serverMedia: [],
		});

		expect(result).toEqual([
			expect.objectContaining({
				id: "media-1",
				isLocalOnly: true,
				localUri: "indexeddb://media-1",
				status: "uploading",
			}),
		]);
	});

	it("prefers local status and localUri when a server record also exists", () => {
		const result = mergeMediaRecords({
			localMedia: [localMediaRecord],
			localAttachments: [],
			serverMedia: [
				{
					id: "media-1",
					userId: "user-1",
					url: "/uploads/media-1.png",
					mimeType: "image/png",
					createdAt: "2026-03-18T09:59:00.000Z",
					updatedAt: "2026-03-18T10:01:00.000Z",
					scopeType: "personal",
					scopeId: "user-1",
					organizationId: "",
					createdBy: "user-1",
					attachments: [attachment],
				},
			],
		});

		expect(result[0]).toEqual(
			expect.objectContaining({
				id: "media-1",
				url: "/uploads/media-1.png",
				localUri: "indexeddb://media-1",
				status: "uploading",
				isLocalOnly: false,
				attachments: [attachment],
			}),
		);
	});

	it("uses local attachments when the item has not reached the server", () => {
		const result = mergeMediaRecords({
			localMedia: [localMediaRecord],
			localAttachments: [attachment],
			serverMedia: [],
		});

		expect(result[0]?.attachments).toEqual([attachment]);
	});
});
