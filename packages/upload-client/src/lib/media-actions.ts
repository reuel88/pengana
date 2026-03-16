import type { EntityDatabase } from "@pengana/entity-store";
import type { Media, MediaAttachment } from "@pengana/sync-engine";

import type { WebMedia, WebMediaAttachment } from "./db";

export async function addMedia(
	db: EntityDatabase,
	userId: string,
	localUri: string,
	mimeType: string,
	scopeType: "personal" | "org",
	scopeId: string,
	organizationId: string | null,
	createdBy: string | null,
): Promise<string> {
	const id = crypto.randomUUID();
	const table = db.getTable<WebMedia>("media");

	await table.put({
		id,
		userId,
		url: null,
		localUri,
		status: "queued",
		mimeType,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		scopeType,
		scopeId,
		organizationId,
		createdBy,
	});

	return id;
}

export async function attachMediaToEntity(
	db: EntityDatabase,
	mediaId: string,
	entityType: string,
	entityId: string,
): Promise<string> {
	const table = db.getTable<WebMediaAttachment>("mediaAttachments");
	const existing = await table.where({ entityType, entityId }).toArray();
	const position = existing.length;

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
	const table = db.getTable<WebMediaAttachment>("mediaAttachments");
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
	await db.getTable<WebMedia>("media").delete(mediaId);
	// Also remove all attachment records for this media
	const attTable = db.getTable<WebMediaAttachment>("mediaAttachments");
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
	await db.getTable<WebMedia>("media").update(mediaId, {
		url,
		status: "uploaded",
	} as never);
}

export async function updateMediaLocalUri(
	db: EntityDatabase,
	mediaId: string,
	localUri: string,
): Promise<void> {
	await db.getTable<WebMedia>("media").update(mediaId, { localUri } as never);
}

export async function markMediaFailed(
	db: EntityDatabase,
	mediaId: string,
): Promise<void> {
	await db.getTable<WebMedia>("media").update(mediaId, {
		status: "failed",
	} as never);
}

export async function getMediaCountForEntity(
	db: EntityDatabase,
	entityId: string,
): Promise<number> {
	return db
		.getTable<WebMediaAttachment>("mediaAttachments")
		.where({ entityId })
		.count();
}

export async function reconcileMedia(
	db: EntityDatabase,
	serverMedia: Media[],
	serverAttachments: MediaAttachment[],
	entityIds?: string[],
): Promise<void> {
	const mediaTable = db.getTable<WebMedia>("media");
	const attTable = db.getTable<WebMediaAttachment>("mediaAttachments");

	// --- Reconcile media records ---
	const serverIds = serverMedia.map((m) => m.id);
	const existingRecords =
		serverIds.length > 0 ? await mediaTable.bulkGet(serverIds) : [];
	const existingById = new Map<string, WebMedia>();
	for (let i = 0; i < serverIds.length; i++) {
		const id = serverIds[i];
		const rec = existingRecords[i];
		if (id && rec) existingById.set(id, rec);
	}

	const toPut: WebMedia[] = [];
	for (const sa of serverMedia) {
		const existing = existingById.get(sa.id);
		if (existing) {
			if (sa.url && existing.url !== sa.url) {
				toPut.push({ ...existing, url: sa.url, status: "uploaded" });
			}
		} else {
			toPut.push({
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
	if (toPut.length > 0) {
		await mediaTable.bulkPut(toPut);
	}

	// --- Reconcile media_attachments ---
	const attToPut: WebMediaAttachment[] = serverAttachments.map((sa) => ({
		id: sa.id,
		mediaId: sa.mediaId,
		entityType: sa.entityType,
		entityId: sa.entityId,
		position: sa.position,
		createdAt: sa.createdAt,
	}));
	if (attToPut.length > 0) {
		await attTable.bulkPut(attToPut);
	}

	// Remove local attachment records that the server no longer has for the synced entities
	if (entityIds && entityIds.length > 0) {
		const serverAttIds = new Set(serverAttachments.map((a) => a.id));
		const localAtts = await attTable
			.where("entityId")
			.anyOf(entityIds)
			.toArray();
		const toDelete = localAtts
			.filter((local) => !serverAttIds.has(local.id))
			.map((local) => local.id);
		if (toDelete.length > 0) {
			await attTable.bulkDelete(toDelete);
		}

		// Remove uploaded media that are no longer attached to any synced entity
		const serverMediaIds = new Set(serverMedia.map((m) => m.id));
		const localMedia = await mediaTable.toArray();
		const mediaToDelete = localMedia
			.filter((m) => !serverMediaIds.has(m.id) && m.status === "uploaded")
			.map((m) => m.id);
		// Only delete media that have no remaining attachment records
		for (const mId of mediaToDelete) {
			const remaining = await attTable.where({ mediaId: mId }).count();
			if (remaining === 0) {
				await mediaTable.delete(mId);
			}
		}
	}
}
