import { createDexieActions } from "@pengana/local-db/dexie";
import {
	addMedia as _addMedia,
	attachMediaToEntity as _attachMedia,
	getMediaCountForEntity as _getMediaCount,
	markMediaFailed as _markMediaFailed,
	removeMedia as _removeMedia,
	updateMediaLocalUri as _updateMediaLocalUri,
	updateMediaUploaded as _updateMediaUploaded,
} from "@pengana/local-db/media";
import type { DexieTodoScope, WebTodo } from "@pengana/local-db/todo";
import { createDexieTodoActions } from "@pengana/local-db/todo";
import { HLC } from "@pengana/sync/core";

import { appDb } from "@/shared/db";

export function createTodoActions(scope: DexieTodoScope) {
	return createDexieTodoActions(appDb, scope);
}

const hlc = new HLC(crypto.randomUUID());
const actions = createDexieActions<WebTodo>(appDb, "todos", {
	hlcNow: () => hlc.now(),
});

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
) => _attachMedia({ db: appDb, mediaId, entityType, entityId });
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
	await actions.update(id, { title } as Partial<WebTodo>);
}
