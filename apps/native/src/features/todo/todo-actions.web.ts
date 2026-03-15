// Web re-exports from the shared todo-client, except `updateTodoTitle` which
// needs a local implementation because the web entity layer (`appDb`) uses a
// different update API than the native Drizzle layer. The native counterpart
// in `todo-actions.ts` operates directly on SQLite via Drizzle.
import type { WebTodo } from "@pengana/todo-client";
import { createTodoActions, personalTodoConfig } from "@pengana/todo-client";
import {
	addMedia as _addMedia,
	getMediaCountForEntity as _getMediaCount,
	markMediaFailed as _markMediaFailed,
	removeMedia as _removeMedia,
	updateMediaUploaded as _updateMediaUploaded,
} from "@pengana/upload-client";

import { appDb } from "@/features/todo/entities/todo";

const actions = createTodoActions(appDb, personalTodoConfig);

export const addTodo = (userId: string, title: string) =>
	actions.addTodo(userId, userId, "", title);
export const toggleTodo = (id: string) => actions.toggleTodo(id);
export const deleteTodo = (id: string) => actions.deleteTodo(id);
export const resolveConflict = (id: string, resolution: "local" | "server") =>
	actions.resolveConflict(id, resolution);
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
