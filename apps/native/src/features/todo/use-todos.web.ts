import type { WebTodo } from "@pengana/todo-client";
import { filterTodos } from "@pengana/todo-client";
import type { WebMedia, WebMediaAttachment } from "@pengana/upload-client";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { appDb } from "@/features/todo/entities/todo";

import type { TodoItemRow } from "./components/todo-item";

function useTodosWithAttachments(
	tableName: string,
	scopeId: string,
	filter?: (item: WebTodo) => boolean,
) {
	const todos = useLiveQuery(
		() => {
			const query = appDb
				.getTable<WebTodo>(tableName)
				.where({ userId: scopeId });
			if (filter) return query.filter(filter).toArray();
			return query.toArray();
		},
		[tableName, scopeId, filter],
		[] as WebTodo[],
	);

	const todoIds = useMemo(() => todos.map((t) => t.id), [todos]);

	const attachmentRecords = useLiveQuery(
		(): Promise<WebMediaAttachment[]> => {
			if (todoIds.length === 0) return Promise.resolve([]);
			return appDb
				.getTable<WebMediaAttachment>("mediaAttachments")
				.where("entityId")
				.anyOf(todoIds)
				.toArray();
		},
		[todoIds],
		[] as WebMediaAttachment[],
	);

	const mediaIds = useMemo(() => {
		return [...new Set(attachmentRecords.map((a) => a.mediaId))];
	}, [attachmentRecords]);

	const mediaRecords = useLiveQuery(
		(): Promise<WebMedia[]> => {
			if (mediaIds.length === 0) return Promise.resolve([]);
			return appDb
				.getTable<WebMedia>("media")
				.where("id")
				.anyOf(mediaIds)
				.toArray();
		},
		[mediaIds],
		[] as WebMedia[],
	);

	const todosWithAttachments: TodoItemRow[] = useMemo(() => {
		const mediaById = new Map<string, WebMedia>();
		for (const m of mediaRecords) {
			mediaById.set(m.id, m);
		}

		const byTodo = new Map<string, WebMedia[]>();
		for (const att of attachmentRecords) {
			const m = mediaById.get(att.mediaId);
			if (!m) continue;
			const list = byTodo.get(att.entityId) ?? [];
			list.push(m);
			byTodo.set(att.entityId, list);
		}

		return todos.map((t) => ({
			...t,
			attachments: (byTodo.get(t.id) ?? []).map((a) => ({
				id: a.id,
				url: a.url,
				localUri: a.localUri,
				status: a.status,
				mimeType: a.mimeType,
			})),
		}));
	}, [todos, attachmentRecords, mediaRecords]);

	const { activeTodos, conflictTodos } = filterTodos(todosWithAttachments);
	return { todos: activeTodos, conflictTodos };
}

export function useTodos(userId: string, organizationId?: string) {
	const filter = useMemo(
		() =>
			organizationId
				? (t: WebTodo) => t.organizationId === organizationId
				: undefined,
		[organizationId],
	);
	return useTodosWithAttachments("todos", userId, filter);
}

export function useOrgTodos(organizationId: string) {
	return useTodosWithAttachments("todos", organizationId);
}
