import { filterTodos } from "@pengana/todo-client";
import { eq, inArray } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

import { appDb, media, todos } from "@/features/todo/entities/todo";

import type { TodoItemRow } from "./components/todo-item";

function useTodosWithAttachments(scopeId: string) {
	const { data: allTodos } = useLiveQuery(
		appDb.select().from(todos).where(eq(todos.userId, scopeId)),
	);

	const todoIds = useMemo(() => (allTodos ?? []).map((t) => t.id), [allTodos]);

	const { data: attachments } = useLiveQuery(
		todoIds.length > 0
			? appDb.select().from(media).where(inArray(media.entityId, todoIds))
			: appDb.select().from(media).where(eq(media.entityId, "__none__")),
		[todoIds],
	);

	const todosWithAttachments: TodoItemRow[] = useMemo(() => {
		const attachmentsByTodo = new Map<string, typeof attachments>();
		for (const a of attachments ?? []) {
			if (!a.entityId) continue;
			const existing = attachmentsByTodo.get(a.entityId) ?? [];
			existing.push(a);
			attachmentsByTodo.set(a.entityId, existing);
		}

		return (allTodos ?? []).map((t) => ({
			...t,
			organizationId: t.organizationId ?? t.userId,
			createdBy: t.createdBy ?? null,
			attachments: (attachmentsByTodo.get(t.id) ?? []).map((a) => ({
				id: a.id,
				url: a.url,
				localUri: a.localUri,
				status: a.status,
				mimeType: a.mimeType,
			})),
		}));
	}, [allTodos, attachments]);

	const { activeTodos, conflictTodos } = filterTodos(todosWithAttachments);
	return { todos: activeTodos, conflictTodos };
}

export function useTodos(userId: string) {
	return useTodosWithAttachments(userId);
}

export function useOrgTodos(organizationId: string) {
	return useTodosWithAttachments(organizationId);
}
