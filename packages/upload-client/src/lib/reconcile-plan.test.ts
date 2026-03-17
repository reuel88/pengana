import type { Media, MediaAttachment } from "@pengana/sync-engine";
import { describe, expect, it } from "vitest";

import { buildReconcilePlan } from "./reconcile-plan";

function makeMedia(overrides: Partial<Media> & { id: string }): Media {
	return {
		userId: "user-1",
		url: null,
		mimeType: "image/jpeg",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
		scopeType: "personal",
		scopeId: "user-1",
		organizationId: null,
		createdBy: "user-1",
		...overrides,
	};
}

function makeAttachment(
	overrides: Partial<MediaAttachment> & { id: string; mediaId: string },
): MediaAttachment {
	return {
		entityType: "todo",
		entityId: "todo-1",
		position: 0,
		createdAt: "2024-01-01T00:00:00Z",
		...overrides,
	};
}

describe("buildReconcilePlan", () => {
	it("inserts new media from server", () => {
		const plan = buildReconcilePlan({
			serverMedia: [makeMedia({ id: "m1", url: "/uploads/m1.jpg" })],
			serverAttachments: [],
			existingMediaById: new Map(),
			existingAttachmentsByEntityId: new Map(),
			existingAttachmentIds: new Set(),
			uploadedMediaNotOnServer: [],
		});

		expect(plan.mediaToInsert).toHaveLength(1);
		expect(plan.mediaToInsert[0]?.id).toBe("m1");
		expect(plan.mediaToInsert[0]?.status).toBe("uploaded");
		expect(plan.mediaToUpdate).toHaveLength(0);
	});

	it("updates existing media when url changes", () => {
		const plan = buildReconcilePlan({
			serverMedia: [makeMedia({ id: "m1", url: "/uploads/m1-v2.jpg" })],
			serverAttachments: [],
			existingMediaById: new Map([
				["m1", { id: "m1", url: "/uploads/m1-v1.jpg" }],
			]),
			existingAttachmentsByEntityId: new Map(),
			existingAttachmentIds: new Set(),
			uploadedMediaNotOnServer: [],
		});

		expect(plan.mediaToInsert).toHaveLength(0);
		expect(plan.mediaToUpdate).toEqual([
			{ id: "m1", url: "/uploads/m1-v2.jpg" },
		]);
	});

	it("skips update when url is unchanged", () => {
		const plan = buildReconcilePlan({
			serverMedia: [makeMedia({ id: "m1", url: "/uploads/m1.jpg" })],
			serverAttachments: [],
			existingMediaById: new Map([
				["m1", { id: "m1", url: "/uploads/m1.jpg" }],
			]),
			existingAttachmentsByEntityId: new Map(),
			existingAttachmentIds: new Set(),
			uploadedMediaNotOnServer: [],
		});

		expect(plan.mediaToInsert).toHaveLength(0);
		expect(plan.mediaToUpdate).toHaveLength(0);
	});

	it("inserts new attachments", () => {
		const plan = buildReconcilePlan({
			serverMedia: [],
			serverAttachments: [
				makeAttachment({ id: "a1", mediaId: "m1" }),
				makeAttachment({ id: "a2", mediaId: "m2" }),
			],
			existingMediaById: new Map(),
			existingAttachmentsByEntityId: new Map(),
			existingAttachmentIds: new Set(["a1"]),
			uploadedMediaNotOnServer: [],
		});

		expect(plan.attachmentsToInsert).toHaveLength(1);
		expect(plan.attachmentsToInsert[0]?.id).toBe("a2");
	});

	it("deletes orphaned attachments for synced entities", () => {
		const plan = buildReconcilePlan({
			serverMedia: [],
			serverAttachments: [makeAttachment({ id: "a1", mediaId: "m1" })],
			existingMediaById: new Map(),
			existingAttachmentsByEntityId: new Map([
				[
					"todo-1",
					[
						{ id: "a1", mediaId: "m1" },
						{ id: "a-orphan", mediaId: "m-orphan" },
					],
				],
			]),
			existingAttachmentIds: new Set(["a1"]),
			uploadedMediaNotOnServer: [],
			entityIds: ["todo-1"],
		});

		expect(plan.attachmentIdsToDelete).toEqual(["a-orphan"]);
	});

	it("does not delete attachments when entityIds is not provided", () => {
		const plan = buildReconcilePlan({
			serverMedia: [],
			serverAttachments: [],
			existingMediaById: new Map(),
			existingAttachmentsByEntityId: new Map([
				["todo-1", [{ id: "a-orphan", mediaId: "m-orphan" }]],
			]),
			existingAttachmentIds: new Set(),
			uploadedMediaNotOnServer: [{ id: "m-orphan", attachmentCount: 0 }],
		});

		expect(plan.attachmentIdsToDelete).toHaveLength(0);
		expect(plan.mediaIdsToDelete).toHaveLength(0);
	});

	it("deletes orphaned uploaded media with no attachments", () => {
		const plan = buildReconcilePlan({
			serverMedia: [],
			serverAttachments: [],
			existingMediaById: new Map(),
			existingAttachmentsByEntityId: new Map(),
			existingAttachmentIds: new Set(),
			uploadedMediaNotOnServer: [
				{ id: "m-orphan-1", attachmentCount: 0 },
				{ id: "m-still-attached", attachmentCount: 1 },
			],
			entityIds: ["todo-1"],
		});

		expect(plan.mediaIdsToDelete).toEqual(["m-orphan-1"]);
	});

	it("sets status to null for media without url", () => {
		const plan = buildReconcilePlan({
			serverMedia: [makeMedia({ id: "m1", url: null })],
			serverAttachments: [],
			existingMediaById: new Map(),
			existingAttachmentsByEntityId: new Map(),
			existingAttachmentIds: new Set(),
			uploadedMediaNotOnServer: [],
		});

		expect(plan.mediaToInsert[0]?.status).toBeNull();
	});
});
