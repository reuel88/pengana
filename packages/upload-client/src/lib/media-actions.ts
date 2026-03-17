import type { EntityDatabase } from "@pengana/entity-store";
import type { Media, MediaAttachment } from "@pengana/sync-engine";

import type { AddMediaOptions, LocalMedia, LocalMediaAttachment } from "./db";
import { buildReconcilePlan } from "./reconcile-plan";

export async function addMedia(
	db: EntityDatabase,
	options: AddMediaOptions,
): Promise<string> {
	const id = crypto.randomUUID();
	const table = db.getTable<LocalMedia>("media");

	await table.put({
		id,
		userId: options.userId,
		url: null,
		localUri: options.localUri,
		status: "queued",
		mimeType: options.mimeType,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		scopeType: options.scopeType,
		scopeId: options.scopeId,
		organizationId: options.organizationId,
		createdBy: options.createdBy,
	});

	return id;
}

export async function attachMediaToEntity(
	db: EntityDatabase,
	mediaId: string,
	entityType: string,
	entityId: string,
): Promise<string> {
	const table = db.getTable<LocalMediaAttachment>("mediaAttachments");
	const existing = await table.where({ entityType, entityId }).toArray();
	const position =
		existing.length > 0 ? Math.max(...existing.map((e) => e.position)) + 1 : 0;

	const id = crypto.randomUUID();
	await table.put({
		id,
		mediaId,
		entityType,
		entityId,
		position,
		createdAt: new Date().toISOString(),
	});

	return id;
}

export async function detachMediaFromEntity(
	db: EntityDatabase,
	mediaId: string,
	entityType: string,
	entityId: string,
): Promise<void> {
	const table = db.getTable<LocalMediaAttachment>("mediaAttachments");
	const records = await table
		.where({ mediaId })
		.filter((r) => r.entityType === entityType && r.entityId === entityId)
		.toArray();
	if (records.length > 0) {
		await table.bulkDelete(records.map((r) => r.id));
	}
}

export async function removeMedia(
	db: EntityDatabase,
	mediaId: string,
): Promise<void> {
	await db.getTable<LocalMedia>("media").delete(mediaId);
	// Also remove all attachment records for this media
	const attTable = db.getTable<LocalMediaAttachment>("mediaAttachments");
	const attachments = await attTable.where({ mediaId }).toArray();
	if (attachments.length > 0) {
		await attTable.bulkDelete(attachments.map((a) => a.id));
	}
}

export async function updateMediaUploaded(
	db: EntityDatabase,
	mediaId: string,
	url: string,
): Promise<void> {
	await db.getTable<LocalMedia>("media").update(mediaId, {
		url,
		status: "uploaded",
	} as never);
}

export async function updateMediaLocalUri(
	db: EntityDatabase,
	mediaId: string,
	localUri: string,
): Promise<void> {
	await db.getTable<LocalMedia>("media").update(mediaId, { localUri } as never);
}

export async function markMediaFailed(
	db: EntityDatabase,
	mediaId: string,
): Promise<void> {
	await db.getTable<LocalMedia>("media").update(mediaId, {
		status: "failed",
	} as never);
}

export async function getMediaCountForEntity(
	db: EntityDatabase,
	entityId: string,
): Promise<number> {
	return db
		.getTable<LocalMediaAttachment>("mediaAttachments")
		.where({ entityId })
		.count();
}

export async function reconcileMedia(
	db: EntityDatabase,
	serverMedia: Media[],
	serverAttachments: MediaAttachment[],
	entityIds?: string[],
): Promise<void> {
	const mediaTable = db.getTable<LocalMedia>("media");
	const attTable = db.getTable<LocalMediaAttachment>("mediaAttachments");

	// --- Query local state ---
	const serverIds = serverMedia.map((m) => m.id);
	const existingRecords =
		serverIds.length > 0 ? await mediaTable.bulkGet(serverIds) : [];
	const existingMediaById = new Map<
		string,
		{ id: string; url: string | null }
	>();
	for (let i = 0; i < serverIds.length; i++) {
		const id = serverIds[i];
		const rec = existingRecords[i];
		if (id && rec) existingMediaById.set(id, rec);
	}

	const existingAttachmentsByEntityId = new Map<
		string,
		{ id: string; mediaId: string }[]
	>();
	const existingAttachmentIds = new Set<string>();

	if (entityIds && entityIds.length > 0) {
		const localAtts = await attTable
			.where("entityId")
			.anyOf(entityIds)
			.toArray();
		for (const att of localAtts) {
			existingAttachmentIds.add(att.id);
			const list = existingAttachmentsByEntityId.get(att.entityId) ?? [];
			list.push({ id: att.id, mediaId: att.mediaId });
			existingAttachmentsByEntityId.set(att.entityId, list);
		}
	}

	// For attachment inserts, also check existing attachments by server IDs
	const serverAttIds = serverAttachments.map((a) => a.id);
	if (serverAttIds.length > 0) {
		const existingAtts = await attTable
			.where("id")
			.anyOf(serverAttIds)
			.toArray();
		for (const att of existingAtts) {
			existingAttachmentIds.add(att.id);
		}
	}

	let uploadedMediaNotOnServer: { id: string; attachmentCount: number }[] = [];
	if (entityIds && entityIds.length > 0) {
		const serverMediaIds = new Set(serverMedia.map((m) => m.id));
		const localUploaded = await mediaTable
			.where("status")
			.equals("uploaded")
			.toArray();
		const candidates = localUploaded.filter((m) => !serverMediaIds.has(m.id));
		uploadedMediaNotOnServer = await Promise.all(
			candidates.map(async (m) => ({
				id: m.id,
				attachmentCount: await attTable.where({ mediaId: m.id }).count(),
			})),
		);
	}

	// --- Build plan ---
	const plan = buildReconcilePlan({
		serverMedia,
		serverAttachments,
		existingMediaById,
		existingAttachmentsByEntityId,
		existingAttachmentIds,
		uploadedMediaNotOnServer,
		entityIds,
	});

	// --- Execute plan ---
	if (plan.mediaToInsert.length > 0) {
		await mediaTable.bulkPut(plan.mediaToInsert);
	}
	for (const update of plan.mediaToUpdate) {
		await mediaTable.update(update.id, {
			url: update.url,
			status: "uploaded",
		} as never);
	}
	if (plan.attachmentsToInsert.length > 0) {
		await attTable.bulkPut(plan.attachmentsToInsert);
	}
	if (plan.attachmentIdsToDelete.length > 0) {
		await attTable.bulkDelete(plan.attachmentIdsToDelete);
	}
	for (const mId of plan.mediaIdsToDelete) {
		await mediaTable.delete(mId);
	}
}
