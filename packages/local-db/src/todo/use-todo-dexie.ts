import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useRef } from "react";
import type { EntityDatabase } from "../dexie";
import { useDexieEntity } from "../hooks/use-dexie-entity";
import type { LocalMedia, LocalMediaAttachment } from "../media/lib/db";

import type { LocalTodo } from "./db";

export interface WebTodoWithAttachments extends LocalTodo {
	attachments: LocalMedia[];
}

export interface UseTodosOptions {
	db: EntityDatabase;
	scopeId: string;
	filter?: (item: LocalTodo) => boolean;
}

export function useTodos({ db, scopeId, filter }: UseTodosOptions) {
	// 1. Query scoped 2do records from local DB
	const { items, conflicts } = useDexieEntity<LocalTodo>(
		db,
		"todos",
		scopeId,
		filter,
	);

	// 2. Derive deduplicated 2do IDs for the attachment query
	const todoIdsRef = useRef<string[]>([]);
	const todoIds = useMemo(() => {
		const next = items.map((t) => t.id);
		const prev = todoIdsRef.current;
		if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
			return prev;
		}
		todoIdsRef.current = next;
		return next;
	}, [items]);

	// 3. Query attachments linked to those 2do IDs
	const attachmentRecords = useLiveQuery(
		(): Promise<LocalMediaAttachment[]> => {
			if (todoIds.length === 0) return Promise.resolve([]);
			return db
				.getTable<LocalMediaAttachment>("mediaAttachments")
				.where("entityId")
				.anyOf(todoIds)
				.toArray();
		},
		[db, todoIds],
		[] as LocalMediaAttachment[],
	);

	// 4. Derive deduplicated media IDs from the attachments
	const mediaIds = useMemo(() => {
		return [...new Set(attachmentRecords.map((a) => a.mediaId))];
	}, [attachmentRecords]);

	// 5. Query media records for those attachment media IDs
	const mediaRecords = useLiveQuery(
		(): Promise<LocalMedia[]> => {
			if (mediaIds.length === 0) return Promise.resolve([]);
			return db
				.getTable<LocalMedia>("media")
				.where("id")
				.anyOf(mediaIds)
				.toArray();
		},
		[db, mediaIds],
		[] as LocalMedia[],
	);

	// 6. Merge todos + attachments + media into a unified list
	const todosWithAttachments: WebTodoWithAttachments[] = useMemo(() => {
		const mediaById = new Map<string, LocalMedia>();
		for (const m of mediaRecords) {
			mediaById.set(m.id, m);
		}

		const byTodo = new Map<string, LocalMedia[]>();
		const sorted = [...attachmentRecords].sort(
			(a, b) => a.position - b.position,
		);
		const seen = new Set<string>();
		for (const att of sorted ?? []) {
			const dedupeKey = `${att.entityId}:${att.mediaId}`;
			if (seen.has(dedupeKey)) continue;
			seen.add(dedupeKey);
			const m = mediaById.get(att.mediaId);
			if (!m) continue;
			const list = byTodo.get(att.entityId) ?? [];
			list.push(m);
			byTodo.set(att.entityId, list);
		}
		return items.map((t) => ({
			...t,
			attachments: byTodo.get(t.id) ?? [],
		}));
	}, [items, attachmentRecords, mediaRecords]);

	return { todos: todosWithAttachments, conflictTodos: conflicts };
}
