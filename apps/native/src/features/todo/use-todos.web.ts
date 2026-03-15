import type { Todo } from "@pengana/sync-engine";
import type { WebMedia, WebOrgTodo } from "@pengana/todo-client";
import { filterTodos } from "@pengana/todo-client";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { appDb } from "@/features/todo/entities/todo";

import type { TodoItemRow } from "./components/todo-item";

function useTodosWithAttachments(tableName: string, scopeId: string) {
	const todos = useLiveQuery(
		() =>
			appDb
				.getTable<Todo | WebOrgTodo>(tableName)
				.where({ userId: scopeId })
				.toArray(),
		[tableName, scopeId],
		[] as (Todo | WebOrgTodo)[],
	);

	const todoIds = useMemo(() => todos.map((t) => t.id), [todos]);

	const attachments = useLiveQuery(
		(): Promise<WebMedia[]> => {
			if (todoIds.length === 0) return Promise.resolve([]);
			return appDb
				.getTable<WebMedia>("media")
				.where("entityId")
				.anyOf(todoIds)
				.toArray();
		},
		[todoIds],
		[] as WebMedia[],
	);

	const todosWithAttachments: TodoItemRow[] = useMemo(() => {
		const attachmentsByTodo = new Map<string, WebMedia[]>();
		for (const a of attachments) {
			if (!a.entityId) continue;
			const existing = attachmentsByTodo.get(a.entityId) ?? [];
			existing.push(a);
			attachmentsByTodo.set(a.entityId, existing);
		}

		return todos.map((t) => ({
			...t,
			attachments: (attachmentsByTodo.get(t.id) ?? []).map((a) => ({
				id: a.id,
				url: a.url,
				localUri: a.localUri,
				status: a.status,
				mimeType: a.mimeType,
			})),
		}));
	}, [todos, attachments]);

	const { activeTodos, conflictTodos } = filterTodos(todosWithAttachments);
	return { todos: activeTodos, conflictTodos };
}

export function useTodos(userId: string) {
	return useTodosWithAttachments("todos", userId);
}

export function useOrgTodos(organizationId: string) {
	return useTodosWithAttachments("orgTodos", organizationId);
}
