import { and, eq, inArray, count as sqlCount } from "drizzle-orm";

import { db } from "./index";
import { media, mediaAttachments } from "./schema/media";

export interface MediaRow {
	id: string;
	userId: string;
	url: string | null;
	mimeType: string;
	createdAt: Date;
	updatedAt: Date;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string | null;
	createdBy: string | null;
}

export interface MediaAttachmentRow {
	id: string;
	mediaId: string;
	entityType: string;
	entityId: string;
	position: number;
	createdAt: Date;
}

export async function findMediaByEntityIds(
	entityIds: string[],
): Promise<
	(MediaRow & { entityId: string; entityType: string; position: number })[]
> {
	if (entityIds.length === 0) return [];
	const rows = await db
		.select({
			id: media.id,
			userId: media.userId,
			url: media.url,
			mimeType: media.mimeType,
			createdAt: media.createdAt,
			updatedAt: media.updatedAt,
			scopeType: media.scopeType,
			scopeId: media.scopeId,
			organizationId: media.organizationId,
			createdBy: media.createdBy,
			entityId: mediaAttachments.entityId,
			entityType: mediaAttachments.entityType,
			position: mediaAttachments.position,
		})
		.from(mediaAttachments)
		.innerJoin(media, eq(media.id, mediaAttachments.mediaId))
		.where(inArray(mediaAttachments.entityId, entityIds));
	return rows;
}

export async function insertMedia(values: {
	id: string;
	userId: string;
	url?: string | null;
	mimeType: string;
	updatedAt?: Date;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId?: string | null;
	createdBy?: string | null;
}): Promise<void> {
	await db
		.insert(media)
		.values(values)
		.onConflictDoUpdate({
			target: media.id,
			set: { url: values.url, updatedAt: values.updatedAt ?? new Date() },
		});
}

export async function updateMediaUrl(id: string, url: string): Promise<void> {
	await db
		.update(media)
		.set({ url, updatedAt: new Date() })
		.where(eq(media.id, id));
}

export async function findMediaById(id: string): Promise<MediaRow | undefined> {
	const rows = await db.select().from(media).where(eq(media.id, id));
	return rows[0];
}

export async function deleteMedia(id: string): Promise<void> {
	await db.delete(media).where(eq(media.id, id));
}

export async function attachMedia(
	mediaId: string,
	entityType: string,
	entityId: string,
	position: number,
): Promise<MediaAttachmentRow> {
	const [row] = await db
		.insert(mediaAttachments)
		.values({
			id: crypto.randomUUID(),
			mediaId,
			entityType,
			entityId,
			position,
		})
		.returning();
	if (!row) throw new Error("Failed to create media attachment");
	return row;
}

export async function detachMedia(
	mediaId: string,
	entityType: string,
	entityId: string,
): Promise<void> {
	await db
		.delete(mediaAttachments)
		.where(
			and(
				eq(mediaAttachments.mediaId, mediaId),
				eq(mediaAttachments.entityType, entityType),
				eq(mediaAttachments.entityId, entityId),
			),
		);
}

export async function findAttachmentsByMedia(
	mediaId: string,
): Promise<MediaAttachmentRow[]> {
	return db
		.select()
		.from(mediaAttachments)
		.where(eq(mediaAttachments.mediaId, mediaId));
}

export async function countMediaByEntityId(entityId: string): Promise<number> {
	const [row] = await db
		.select({ count: sqlCount() })
		.from(mediaAttachments)
		.where(eq(mediaAttachments.entityId, entityId));
	return row?.count ?? 0;
}

export async function findMediaAttachmentsByEntityIds(
	entityIds: string[],
): Promise<MediaAttachmentRow[]> {
	if (entityIds.length === 0) return [];
	return db
		.select()
		.from(mediaAttachments)
		.where(inArray(mediaAttachments.entityId, entityIds));
}
