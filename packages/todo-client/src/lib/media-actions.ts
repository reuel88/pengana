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
	await db.getTable<WebMedia>("media").update(mediaId, {
		url,
		status: "uploaded",
	} as never);
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
	return db.getTable<WebMedia>("media").where({ entityId }).count();
}

export async function reconcileMedia(
	db: EntityDatabase,
	serverMedia: Media[],
	entityIds?: string[],
): Promise<void> {
	const table = db.getTable<WebMedia>("media");

	// Upsert server media
	for (const sa of serverMedia) {
		const existing = await table.get(sa.id);
		if (existing) {
			if (sa.url && existing.url !== sa.url) {
				await table.update(sa.id, {
					url: sa.url,
					status: "uploaded",
				} as never);
			}
		} else {
			await table.put({
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
			});
		}
	}

	// Remove local media that the server no longer has for the synced entities
	if (entityIds && entityIds.length > 0) {
		const serverMediaIds = new Set(serverMedia.map((m) => m.id));
		for (const entityId of entityIds) {
			const localMedia = await table.where({ entityId }).toArray();
			for (const local of localMedia) {
				if (!serverMediaIds.has(local.id)) {
					await table.delete(local.id);
				}
			}
		}
	}
}
