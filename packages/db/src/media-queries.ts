import { eq, inArray } from "drizzle-orm";

import { db } from "./index";
import { media } from "./schema/media";

export interface MediaRow {
	id: string;
	entityId: string | null;
	entityType: string | null;
	userId: string;
	url: string | null;
	mimeType: string;
	position: number;
	createdAt: Date;
}

export async function findMediaByEntityIds(
	entityIds: string[],
): Promise<MediaRow[]> {
	if (entityIds.length === 0) return [];
	return db.select().from(media).where(inArray(media.entityId, entityIds));
}

export async function insertMedia(values: {
	id: string;
	entityId?: string | null;
	entityType?: string | null;
	userId: string;
	url?: string | null;
	mimeType: string;
	position: number;
}): Promise<void> {
	await db.insert(media).values(values);
}

export async function updateMediaUrl(id: string, url: string): Promise<void> {
	await db.update(media).set({ url }).where(eq(media.id, id));
}

export async function findMediaById(id: string): Promise<MediaRow | undefined> {
	const rows = await db.select().from(media).where(eq(media.id, id));
	return rows[0];
}

export async function deleteMedia(id: string): Promise<void> {
	await db.delete(media).where(eq(media.id, id));
}

export async function countMediaByEntityId(entityId: string): Promise<number> {
	const rows = await db
		.select({ id: media.id })
		.from(media)
		.where(eq(media.entityId, entityId));
	return rows.length;
}
