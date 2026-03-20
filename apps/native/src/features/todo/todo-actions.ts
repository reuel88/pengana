import { createDrizzleActions } from "@pengana/entity-store";
import { drizzleMedia } from "@pengana/upload-client";
import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { appDb, media, mediaAttachments, todos } from "@/shared/db";

export const actions = createDrizzleActions<typeof todos.$inferInsert>(
	appDb,
	todos,
	todos.id,
);

export async function addTodo(
	userId: string,
	title: string,
	organizationId: string,
): Promise<void> {
	await actions.add({
		id: randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId,
		scopeId: userId,
		organizationId,
		createdBy: userId,
		scopeType: "personal",
		syncStatus: "pending",
		deleted: false,
	});
}

export async function toggleTodo(id: string): Promise<void> {
	const [todo] = await appDb.select().from(todos).where(eq(todos.id, id));
	if (!todo) throw new Error(`Todo not found: ${id}`);

	await actions.update(id, { completed: !todo.completed });
}

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await actions.update(id, { title });
}

export async function deleteTodo(id: string): Promise<void> {
	await actions.softDelete(id);
}

export async function resolveConflict(
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	await actions.resolveConflict(id, resolution);
}

export const addMedia = (options: {
	userId: string;
	localUri: string;
	mimeType: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	createdBy: string;
}): Promise<string> => drizzleMedia.addMedia(appDb, media, randomUUID, options);

export const attachMedia = (
	mediaId: string,
	entityType: string,
	entityId: string,
): Promise<string> =>
	drizzleMedia.attachMediaToEntity(
		appDb,
		mediaAttachments,
		randomUUID,
		mediaId,
		entityType,
		entityId,
	);

export const removeMedia = async (mediaId: string): Promise<void> => {
	await drizzleMedia.removeMediaAttachments(appDb, mediaAttachments, mediaId);
	await drizzleMedia.removeMedia(appDb, media, mediaId);
};

export const updateMediaUploaded = (
	mediaId: string,
	url: string,
): Promise<void> =>
	drizzleMedia.updateMediaUploaded(appDb, media, mediaId, url);

export const markMediaFailed = (mediaId: string): Promise<void> =>
	drizzleMedia.markMediaFailed(appDb, media, mediaId);

export const updateMediaLocalUri = (
	mediaId: string,
	localUri: string,
): Promise<void> =>
	drizzleMedia.updateMediaLocalUri(appDb, media, mediaId, localUri);

export const retryMedia = (mediaId: string) =>
	drizzleMedia.retryMedia(appDb, media, mediaId);

export const getMediaCountForEntity = (entityId: string): Promise<number> =>
	drizzleMedia.getMediaCountForEntity(appDb, mediaAttachments, entityId);

export async function getAttachmentForMedia(mediaId: string) {
	const [row] = await appDb
		.select()
		.from(mediaAttachments)
		.where(eq(mediaAttachments.mediaId, mediaId))
		.limit(1);
	return row ?? null;
}
