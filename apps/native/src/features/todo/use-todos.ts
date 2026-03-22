import { useDrizzleEntity } from "@pengana/entity-store/hooks/use-drizzle-entity";
import { safeParseFieldClocks } from "@pengana/sync/core";
import { eq, type InferSelectModel, inArray } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

import { appDb, media, mediaAttachments, todos } from "@/shared/db";

import type { TodoItemRow } from "./components/todo-item";

type TodoRow = InferSelectModel<typeof todos>;

function useTodosWithAttachments(scopeId: string) {
	// Get todos
	const { items, conflicts } = useDrizzleEntity<TodoRow>(appDb, todos, scopeId);

	// All 2do ids
	const todoIds = useMemo(() => (items ?? []).map((t) => t.id), [items]);

	// Get attachments for the todos
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

	// All media ids for the attachments
	const mediaIds = useMemo(() => {
		return [...new Set((attachmentRecords ?? []).map((a) => a.mediaId))];
	}, [attachmentRecords]);

	// Get media records for the attachments
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
		const sorted = [...(attachmentRecords ?? [])].sort(
			(a, b) => a.position - b.position,
		);
		const seen = new Set<string>();
		for (const att of sorted) {
			const dedupeKey = `${att.entityId}:${att.mediaId}`;
			if (seen.has(dedupeKey)) continue;
			seen.add(dedupeKey);
			const m = mediaById.get(att.mediaId);
			if (!m) continue;
			const list = byTodo.get(att.entityId) ?? [];
			list.push(m);
			byTodo.set(att.entityId, list);
		}

		return (items ?? []).map((t) => ({
			...t,
			fieldClocks: safeParseFieldClocks(t.fieldClocks),
			attachments: byTodo.get(t.id) ?? [],
		}));
	}, [items, attachmentRecords, mediaRecords]);

	return { todos: todosWithAttachments, conflictTodos: conflicts };
}

export function useTodos(userId: string, _organizationId?: string) {
	return useTodosWithAttachments(userId);
}

export function useOrgTodos(organizationId: string) {
	return useTodosWithAttachments(organizationId);
}
