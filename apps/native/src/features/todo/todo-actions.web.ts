// Web re-exports from the shared todo-client, except `updateTodoTitle` which
// needs a local implementation because the web entity layer (`appDb`) uses a
// different update API than the native Drizzle layer. The native counterpart
// in `todo-actions.ts` operates directly on SQLite via Drizzle.
import type { WebTodo } from "@pengana/todo-client";
import {
	addMedia as _addMedia,
	addTodo as _addTodo,
	deleteTodo as _deleteTodo,
	getMediaCountForEntity as _getMediaCount,
	markMediaFailed as _markMediaFailed,
	removeMedia as _removeMedia,
	resolveConflict as _resolveConflict,
	toggleTodo as _toggleTodo,
	updateMediaUploaded as _updateMediaUploaded,
} from "@pengana/todo-client";

import { appDb } from "@/features/todo/entities/todo";

export const addTodo = (userId: string, title: string) =>
	_addTodo(appDb, userId, title);
export const toggleTodo = (id: string) => _toggleTodo(appDb, id);
export const deleteTodo = (id: string) => _deleteTodo(appDb, id);
export const resolveConflict = (id: string, resolution: "local" | "server") =>
	_resolveConflict(appDb, id, resolution);
export const addMedia = (
	entityId: string,
	entityType: string,
	userId: string,
	localUri: string,
	mimeType: string,
) => _addMedia(appDb, entityId, entityType, userId, localUri, mimeType);
export const removeMedia = (mediaId: string) => _removeMedia(appDb, mediaId);
export const updateMediaUploaded = (mediaId: string, url: string) =>
	_updateMediaUploaded(appDb, mediaId, url);
export const markMediaFailed = (mediaId: string) =>
	_markMediaFailed(appDb, mediaId);
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
