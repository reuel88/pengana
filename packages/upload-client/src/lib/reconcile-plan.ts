import type { Media, MediaAttachment } from "@pengana/sync-engine";

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

	// --- Media: inserts and updates ---
	const mediaToInsert: LocalMedia[] = [];
	const mediaToUpdate: { id: string; url: string }[] = [];

	for (const sa of serverMedia) {
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

	// --- Attachments: inserts ---
	const attachmentsToInsert: LocalMediaAttachment[] = serverAttachments
		.filter((sa) => !existingAttachmentIds.has(sa.id))
		.map((sa) => ({
			id: sa.id,
			mediaId: sa.mediaId,
			entityType: sa.entityType,
			entityId: sa.entityId,
			position: sa.position,
			createdAt: sa.createdAt,
		}));

	// --- Attachment and media deletions (only when entityIds are provided) ---
	const attachmentIdsToDelete: string[] = [];
	const mediaIdsToDelete: string[] = [];

	if (entityIds && entityIds.length > 0) {
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
