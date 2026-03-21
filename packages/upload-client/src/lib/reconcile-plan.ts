import type { Media, MediaAttachment } from "@pengana/sync/core";

import type { LocalMedia, LocalMediaAttachment } from "./db";

export interface ReconcilePlan {
	mediaToInsert: LocalMedia[];
	mediaToUpdate: { id: string; url: string }[];
	attachmentsToInsert: LocalMediaAttachment[];
	attachmentIdsToDelete: string[];
	mediaIdsToDelete: string[];
}

export interface ReconcilePlanInput {
	serverMedia: Media[];
	serverAttachments: MediaAttachment[];
	existingMediaById: Map<string, { id: string; url: string | null }>;
	existingAttachmentsByEntityId: Map<string, { id: string; mediaId: string }[]>;
	existingAttachmentIds: Set<string>;
	uploadedMediaNotOnServer: { id: string; attachmentCount: number }[];
	entityIds?: string[];
	/** When true, delete local uploaded media not present on server (scope-wide sync). */
	scopeWide?: boolean;
}

export function buildReconcilePlan(input: ReconcilePlanInput): ReconcilePlan {
	const {
		serverMedia,
		serverAttachments,
		existingMediaById,
		existingAttachmentIds,
		uploadedMediaNotOnServer,
		entityIds,
	} = input;

	// --- Separate active media from soft-deleted media ---
	const activeMedia: Media[] = [];
	const deletedMediaIds = new Set<string>();
	for (const sa of serverMedia) {
		if (sa.deletedAt) {
			deletedMediaIds.add(sa.id);
		} else {
			activeMedia.push(sa);
		}
	}

	// --- Media: inserts and updates ---
	const mediaToInsert: LocalMedia[] = [];
	const mediaToUpdate: { id: string; url: string }[] = [];

	for (const sa of activeMedia) {
		const existing = existingMediaById.get(sa.id);
		if (existing) {
			if (sa.url && existing.url !== sa.url) {
				mediaToUpdate.push({ id: sa.id, url: sa.url });
			}
		} else {
			mediaToInsert.push({
				id: sa.id,
				userId: sa.userId,
				url: sa.url,
				localUri: null,
				status: sa.url ? "uploaded" : null,
				mimeType: sa.mimeType,
				createdAt: sa.createdAt,
				updatedAt: sa.updatedAt,
				scopeType: sa.scopeType,
				scopeId: sa.scopeId,
				organizationId: sa.organizationId,
				createdBy: sa.createdBy,
			});
		}
	}

	// --- Attachments: inserts (skip attachments for deleted media) ---
	const attachmentsToInsert: LocalMediaAttachment[] = serverAttachments
		.filter(
			(sa) =>
				!existingAttachmentIds.has(sa.id) && !deletedMediaIds.has(sa.mediaId),
		)
		.map((sa) => ({
			id: sa.id,
			mediaId: sa.mediaId,
			entityType: sa.entityType,
			entityId: sa.entityId,
			position: sa.position,
			createdAt: sa.createdAt,
		}));

	// --- Attachment and media deletions ---
	const attachmentIdsToDelete: string[] = [];
	const mediaIdsToDelete: string[] = [];

	// Delete media that the server has soft-deleted
	for (const id of deletedMediaIds) {
		if (existingMediaById.has(id)) {
			mediaIdsToDelete.push(id);
		}
	}
	// Delete attachments belonging to soft-deleted media
	for (const sa of serverAttachments) {
		if (deletedMediaIds.has(sa.mediaId) && existingAttachmentIds.has(sa.id)) {
			attachmentIdsToDelete.push(sa.id);
		}
	}

	if (input.scopeWide) {
		// Scope-wide sync: delete uploaded media not present on server
		const serverMediaIds = new Set(serverMedia.map((m) => m.id));
		for (const candidate of uploadedMediaNotOnServer) {
			if (!serverMediaIds.has(candidate.id)) {
				mediaIdsToDelete.push(candidate.id);
			}
		}
	} else if (entityIds && entityIds.length > 0) {
		const serverAttIds = new Set(serverAttachments.map((a) => a.id));
		const entityIdSet = new Set(entityIds);

		// Find local attachments for the synced entities that are no longer on the server
		for (const [entityId, atts] of input.existingAttachmentsByEntityId) {
			if (!entityIdSet.has(entityId)) continue;
			for (const att of atts) {
				if (!serverAttIds.has(att.id)) {
					attachmentIdsToDelete.push(att.id);
				}
			}
		}

		// Find uploaded media not on server that have no remaining attachments
		for (const candidate of uploadedMediaNotOnServer) {
			if (candidate.attachmentCount === 0) {
				mediaIdsToDelete.push(candidate.id);
			}
		}
	}

	return {
		mediaToInsert,
		mediaToUpdate,
		attachmentsToInsert,
		attachmentIdsToDelete,
		mediaIdsToDelete,
	};
}
