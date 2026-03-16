import { type EntityDatabase, useDexieEntity } from "@pengana/entity-store";
import type { WebMedia, WebMediaAttachment } from "@pengana/upload-client";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useRef } from "react";

import type { WebTodo } from "../lib/db";
import type { TodoConfig } from "../lib/todo-config";

export interface WebTodoWithAttachments extends WebTodo {
	attachments: WebMedia[];
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
		(): Promise<WebMediaAttachment[]> => {
			if (todoIds.length === 0) return Promise.resolve([]);
			return db
				.getTable<WebMediaAttachment>("mediaAttachments")
				.where("entityId")
				.anyOf(todoIds)
				.toArray();
		},
		[db, todoIds],
		[] as WebMediaAttachment[],
	);

	const mediaIds = useMemo(() => {
		const ids = [...new Set(attachmentRecords.map((a) => a.mediaId))];
		return ids;
	}, [attachmentRecords]);

	const mediaRecords = useLiveQuery(
		(): Promise<WebMedia[]> => {
			if (mediaIds.length === 0) return Promise.resolve([]);
			return db
				.getTable<WebMedia>("media")
				.where("id")
				.anyOf(mediaIds)
				.toArray();
		},
		[db, mediaIds],
		[] as WebMedia[],
	);

	const todos: WebTodoWithAttachments[] = useMemo(() => {
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
		return items.map((t) => ({
			...t,
			attachments: byTodo.get(t.id) ?? [],
		}));
	}, [items, attachmentRecords, mediaRecords]);

	return { todos, conflictTodos: conflicts };
}
