import type { EntityDatabase } from "@pengana/entity-store";
import type { Media } from "@pengana/sync-engine";

import type { WebMedia } from "./db";

export async function addMedia(
	db: EntityDatabase,
	entityId: string | null,
	entityType: string | null,
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

	const existing = entityId ? await table.where({ entityId }).toArray() : [];
	const position = existing.length;

	await table.put({
		id,
		entityId,
		entityType,
		userId,
		url: null,
		localUri,
		status: "queued",
		mimeType,
		position,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		scopeType,
		scopeId,
		organizationId,
		createdBy,
	});

	return id;
}

export async function removeMedia(
	db: EntityDatabase,
	mediaId: string,
): Promise<void> {
	await db.getTable<WebMedia>("media").delete(mediaId);
}

export async function updateMediaUploaded(
	db: EntityDatabase,
	mediaId: string,
	url: string,
): Promise<void> {
	// Dexie .update() doesn't type partial updates
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
	// Dexie .update() doesn't type partial updates
	await db.getTable<WebMedia>("media").update(mediaId, { localUri } as never);
}

export async function markMediaFailed(
	db: EntityDatabase,
	mediaId: string,
): Promise<void> {
	// Dexie .update() doesn't type partial updates
	await db.getTable<WebMedia>("media").update(mediaId, {
		status: "failed",
	} as never);
}

export async function getMediaCountForEntity(
	db: EntityDatabase,
	entityId: string,
): Promise<number> {
	return db.getTable<WebMedia>("media").where({ entityId }).count();
}

export async function reconcileMedia(
	db: EntityDatabase,
	serverMedia: Media[],
	entityIds?: string[],
): Promise<void> {
	const table = db.getTable<WebMedia>("media");

	// Bulk-fetch existing records for all server media IDs in one query
	const serverIds = serverMedia.map((m) => m.id);
	const existingRecords =
		serverIds.length > 0 ? await table.bulkGet(serverIds) : [];
	const existingById = new Map<string, WebMedia>();
	for (let i = 0; i < serverIds.length; i++) {
		const id = serverIds[i];
		const rec = existingRecords[i];
		if (id && rec) existingById.set(id, rec);
	}

	// Upsert server media — collect puts and updates, then apply in bulk
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
				entityId: sa.entityId,
				entityType: sa.entityType,
				userId: sa.userId,
				url: sa.url,
				localUri: null,
				status: sa.url ? "uploaded" : null,
				mimeType: sa.mimeType,
				position: sa.position,
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
		await table.bulkPut(toPut);
	}

	// Remove local media that the server no longer has for the synced entities
	if (entityIds && entityIds.length > 0) {
		const serverMediaIds = new Set(serverMedia.map((m) => m.id));
		const localMedia = await table.where("entityId").anyOf(entityIds).toArray();
		const toDelete = localMedia
			.filter((local) => !serverMediaIds.has(local.id))
			.map((local) => local.id);
		if (toDelete.length > 0) {
			await table.bulkDelete(toDelete);
		}
	}
}
