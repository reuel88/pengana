import { drizzleMedia } from "@pengana/upload-client";
import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { appDb, media, todos } from "@/features/todo/entities/todo";
import { pendingUpdate } from "./lib/pending-update";

export async function addTodo(
	userId: string,
	title: string,
	organizationId?: string,
): Promise<void> {
	await appDb.insert(todos).values({
		id: randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId,
		organizationId: organizationId ?? null,
		scopeType: "personal",
		syncStatus: "pending",
		deleted: false,
	});
}

export async function toggleTodo(id: string): Promise<void> {
	const [todo] = await appDb.select().from(todos).where(eq(todos.id, id));
	if (!todo) throw new Error(`Todo not found: ${id}`);

	await pendingUpdate(id, { completed: !todo.completed });
}

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await pendingUpdate(id, { title });
}

export async function deleteTodo(id: string): Promise<void> {
	await pendingUpdate(id, { deleted: true });
}

export async function resolveConflict(
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	if (resolution === "local") {
		await pendingUpdate(id, {});
	} else {
		await appDb
			.update(todos)
			.set({ syncStatus: "synced" })
			.where(eq(todos.id, id));
	}
}

export const addMedia = (
	entityId: string,
	entityType: string,
	userId: string,
	localUri: string,
	mimeType: string,
	scopeType: "personal" | "org",
	scopeId: string,
	organizationId: string | null,
	createdBy: string | null,
): Promise<string> =>
	drizzleMedia.addMedia(
		appDb,
		media,
		randomUUID,
		entityId,
		entityType,
		userId,
		localUri,
		mimeType,
		scopeType,
		scopeId,
		organizationId,
		createdBy,
	);

export const removeMedia = (mediaId: string): Promise<void> =>
	drizzleMedia.removeMedia(appDb, media, mediaId);

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
	drizzleMedia.getMediaCountForEntity(appDb, media, entityId);
