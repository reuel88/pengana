import { createDexieActions } from "@pengana/entity-store";
import type { WebTodo } from "@pengana/todo-client";
import {
	addMedia as _addMedia,
	attachMediaToEntity as _attachMedia,
	getMediaCountForEntity as _getMediaCount,
	markMediaFailed as _markMediaFailed,
	removeMedia as _removeMedia,
	updateMediaLocalUri as _updateMediaLocalUri,
	updateMediaUploaded as _updateMediaUploaded,
} from "@pengana/upload-client";

import { appDb } from "@/shared/db";

const actions = createDexieActions<WebTodo>(appDb, "todos");

export async function addTodo(
	userId: string,
	title: string,
	organizationId: string,
): Promise<void> {
	await actions.add({
		id: crypto.randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		scopeId: userId,
		userId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "personal",
	});
}

export async function toggleTodo(id: string): Promise<void> {
	const todo = await appDb.getTable<WebTodo>("todos").get(id);
	if (!todo) throw new Error(`Todo not found: ${id}`);
	await actions.update(id, { completed: !todo.completed });
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
}) => _addMedia(appDb, options);
export const attachMedia = (
	mediaId: string,
	entityType: string,
	entityId: string,
) => _attachMedia(appDb, mediaId, entityType, entityId);
export const removeMedia = (mediaId: string) => _removeMedia(appDb, mediaId);
export const updateMediaUploaded = (mediaId: string, url: string) =>
	_updateMediaUploaded(appDb, mediaId, url);
export const markMediaFailed = (mediaId: string) =>
	_markMediaFailed(appDb, mediaId);
export const updateMediaLocalUri = (mediaId: string, localUri: string) =>
	_updateMediaLocalUri(appDb, mediaId, localUri);
export const getMediaCountForEntity = (entityId: string) =>
	_getMediaCount(appDb, entityId);

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await appDb.getTable<WebTodo>("todos").update(id, {
		title,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	} as never);
}
