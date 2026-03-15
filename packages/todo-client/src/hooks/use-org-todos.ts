import { type EntityDatabase, useDexieEntity } from "@pengana/entity-store";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useRef } from "react";

import type { WebMedia, WebOrgTodo } from "../lib/db";

export interface WebOrgTodoWithAttachments extends WebOrgTodo {
	attachments: WebMedia[];
}

export function useOrgTodos(db: EntityDatabase, organizationId: string) {
	const { items, conflicts } = useDexieEntity<WebOrgTodo>(
		db,
		"orgTodos",
		organizationId,
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

	const attachments = useLiveQuery(
		(): Promise<WebMedia[]> => {
			if (todoIds.length === 0) return Promise.resolve([]);
			return db
				.getTable<WebMedia>("media")
				.where("entityId")
				.anyOf(todoIds)
				.toArray();
		},
		[db, todoIds],
		[] as WebMedia[],
	);

	const todos: WebOrgTodoWithAttachments[] = useMemo(() => {
		const byTodo = new Map<string, WebMedia[]>();
		for (const a of attachments) {
			if (!a.entityId) continue;
			const list = byTodo.get(a.entityId) ?? [];
			list.push(a);
			byTodo.set(a.entityId, list);
		}
		return items.map((t) => ({
			...t,
			attachments: byTodo.get(t.id) ?? [],
		}));
	}, [items, attachments]);

	return { todos, conflictTodos: conflicts };
}
