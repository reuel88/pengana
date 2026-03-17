import { filterTodos } from "@pengana/todo-client";
import { and, eq, inArray } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

import {
	appDb,
	media,
	mediaAttachments,
	todos,
} from "@/features/todo/entities/todo";

import type { TodoItemRow } from "./components/todo-item";

function useTodosWithAttachments(scopeId: string, organizationId?: string) {
	const { data: allTodos } = useLiveQuery(
		organizationId
			? appDb
					.select()
					.from(todos)
					.where(
						and(
							eq(todos.userId, scopeId),
							eq(todos.organizationId, organizationId),
						),
					)
			: appDb.select().from(todos).where(eq(todos.userId, scopeId)),
		[scopeId, organizationId],
	);

	const todoIds = useMemo(() => (allTodos ?? []).map((t) => t.id), [allTodos]);

	const { data: attachmentRecords } = useLiveQuery(
		todoIds.length > 0
			? appDb
					.select()
					.from(mediaAttachments)
					.where(inArray(mediaAttachments.entityId, todoIds))
			: appDb
					.select()
					.from(mediaAttachments)
					.where(eq(mediaAttachments.entityId, "__none__")),
		[todoIds],
	);

	const mediaIds = useMemo(() => {
		const ids = [...new Set((attachmentRecords ?? []).map((a) => a.mediaId))];
		return ids;
	}, [attachmentRecords]);

	const { data: mediaRecords } = useLiveQuery(
		mediaIds.length > 0
			? appDb.select().from(media).where(inArray(media.id, mediaIds))
			: appDb.select().from(media).where(eq(media.id, "__none__")),
		[mediaIds],
	);

	const todosWithAttachments: TodoItemRow[] = useMemo(() => {
		const mediaById = new Map<
			string,
			typeof mediaRecords extends (infer T)[] | undefined ? T : never
		>();
		for (const m of mediaRecords ?? []) {
			mediaById.set(m.id, m);
		}

		const byTodo = new Map<string, typeof mediaRecords>();
		for (const att of attachmentRecords ?? []) {
			const m = mediaById.get(att.mediaId);
			if (!m) continue;
			const list = byTodo.get(att.entityId) ?? [];
			list.push(m);
			byTodo.set(att.entityId, list);
		}

		return (allTodos ?? []).map((t) => ({
			...t,
			organizationId: t.organizationId ?? t.userId,
			createdBy: t.createdBy ?? null,
			attachments: (byTodo.get(t.id) ?? []).map((a) => ({
				id: a.id,
				url: a.url,
				localUri: a.localUri,
				status: a.status,
				mimeType: a.mimeType,
			})),
		}));
	}, [allTodos, attachmentRecords, mediaRecords]);

	const { activeTodos, conflictTodos } = filterTodos(todosWithAttachments);
	return { todos: activeTodos, conflictTodos };
}

export function useTodos(userId: string, organizationId?: string) {
	return useTodosWithAttachments(userId, organizationId);
}

export function useOrgTodos(organizationId: string) {
	return useTodosWithAttachments(organizationId);
}
