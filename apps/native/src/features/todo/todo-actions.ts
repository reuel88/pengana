import { createDrizzleActions } from "@pengana/local-db/drizzle";
import { drizzleMedia } from "@pengana/local-db/media";
import { createDrizzleTodoActions } from "@pengana/local-db/todo";
import { HLC } from "@pengana/sync/core";
import { randomUUID } from "expo-crypto";

import { appDb, media, mediaAttachments, todos } from "@/shared/db";

export function createTodoActions() {
	return createDrizzleTodoActions({
		db: appDb,
		todosTable: todos,
		idColumn: todos.id,
		generateId: randomUUID,
	});
}

const hlc = new HLC(randomUUID());
const drizzleActions = createDrizzleActions<typeof todos.$inferInsert>(
	appDb,
	todos,
	todos.id,
	{ hlcNow: () => hlc.now() },
);

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await drizzleActions.update(id, { title });
}

export const addMedia = (options: {
	userId: string;
	localUri: string;
	mimeType: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	createdBy: string;
}): Promise<string> =>
	drizzleMedia.addMedia({
		db: appDb,
		table: media,
		generateId: randomUUID,
		options,
	});

export const attachMedia = (
	mediaId: string,
	entityType: string,
	entityId: string,
): Promise<string> =>
	drizzleMedia.attachMediaToEntity({
		db: appDb,
		table: mediaAttachments,
		generateId: randomUUID,
		mediaId,
		entityType,
		entityId,
	});

export const removeMedia = async (mediaId: string): Promise<void> => {
	await drizzleMedia.removeMediaAttachments(appDb, mediaAttachments, mediaId);
	await drizzleMedia.removeMedia(appDb, media, mediaId);
};

export const updateMediaUploaded = (
	mediaId: string,
	url: string,
): Promise<void> =>
	drizzleMedia.updateMediaUploaded({ db: appDb, table: media, mediaId, url });

export const markMediaFailed = (mediaId: string): Promise<void> =>
	drizzleMedia.markMediaFailed(appDb, media, mediaId);

export const updateMediaLocalUri = (
	mediaId: string,
	localUri: string,
): Promise<void> =>
	drizzleMedia.updateMediaLocalUri({
		db: appDb,
		table: media,
		mediaId,
		localUri,
	});

export const retryMedia = (mediaId: string) =>
	drizzleMedia.retryMedia(appDb, media, mediaId);

export const getMediaCountForEntity = (entityId: string): Promise<number> =>
	drizzleMedia.getMediaCountForEntity(appDb, mediaAttachments, entityId);

export const getAttachmentForMedia = (mediaId: string) =>
	drizzleMedia.getAttachmentForMedia(appDb, mediaAttachments, mediaId);
