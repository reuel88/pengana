import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { appDb, media, todos } from "@/features/todo/entities/todo";
import { pendingUpdate } from "./lib/pending-update";

export async function addTodo(userId: string, title: string): Promise<void> {
	await appDb.insert(todos).values({
		id: randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId,
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

export async function addMedia(
	entityId: string,
	entityType: string,
	userId: string,
	localUri: string,
	mimeType: string,
): Promise<string> {
	const id = randomUUID();
	const existing = await appDb
		.select()
		.from(media)
		.where(eq(media.entityId, entityId));
	const position = existing.length;

	await appDb.insert(media).values({
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

export async function removeMedia(mediaId: string): Promise<void> {
	await appDb.delete(media).where(eq(media.id, mediaId));
}

export async function updateMediaUploaded(
	mediaId: string,
	url: string,
): Promise<void> {
	await appDb
		.update(media)
		.set({ url, status: "uploaded" })
		.where(eq(media.id, mediaId));
}

export async function markMediaFailed(mediaId: string): Promise<void> {
	await appDb
		.update(media)
		.set({ status: "failed" })
		.where(eq(media.id, mediaId));
}

export async function retryMedia(mediaId: string) {
	await appDb
		.update(media)
		.set({ status: "queued" })
		.where(eq(media.id, mediaId));

	const [record] = await appDb
		.select()
		.from(media)
		.where(eq(media.id, mediaId));
	return record ?? null;
}

export async function getMediaCountForEntity(
	entityId: string,
): Promise<number> {
	const rows = await appDb
		.select()
		.from(media)
		.where(eq(media.entityId, entityId));
	return rows.length;
}
