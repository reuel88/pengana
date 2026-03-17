import { type EntityDatabase, useDexieEntity } from "@pengana/entity-store";
import type { LocalMedia, LocalMediaAttachment } from "@pengana/upload-client";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useRef } from "react";

import type { WebTodo } from "../lib/db";
import type { TodoConfig } from "../lib/todo-config";

export interface WebTodoWithAttachments extends WebTodo {
	attachments: LocalMedia[];
}

export function useTodos(
	db: EntityDatabase,
	config: TodoConfig,
	scopeId: string,
	filter?: (item: WebTodo) => boolean,
) {
	const { items, conflicts } = useDexieEntity<WebTodo>(
		db,
		config.entity.name,
		scopeId,
		filter,
	);

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

	const mediaIds = useMemo(() => {
		const ids = [...new Set(attachmentRecords.map((a) => a.mediaId))];
		return ids;
	}, [attachmentRecords]);

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

	const todos: WebTodoWithAttachments[] = useMemo(() => {
		const mediaById = new Map<string, LocalMedia>();
		for (const m of mediaRecords) {
			mediaById.set(m.id, m);
		}

		const byTodo = new Map<string, LocalMedia[]>();
		const sorted = [...attachmentRecords].sort(
			(a, b) => a.position - b.position,
		);
		for (const att of sorted) {
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

	return { todos, conflictTodos: conflicts };
}
