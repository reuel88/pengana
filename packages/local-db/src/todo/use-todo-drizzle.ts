import { safeParseFieldClocks } from "@pengana/sync/core";
import { eq, inArray } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { useMemo } from "react";
import { useDrizzleEntity } from "../hooks/use-drizzle-entity";
import type { LocalMedia, LocalMediaAttachment } from "../media/lib/db";

import type { LocalTodo } from "./db";

type SyncableTable = SQLiteTable & { scopeId: SQLiteColumn };

type MediaAttachmentTable = SQLiteTable & {
	entityId: SQLiteColumn;
	mediaId: SQLiteColumn;
	position: SQLiteColumn;
};

type MediaTable = SQLiteTable & {
	id: SQLiteColumn;
};

export interface DrizzleTodoWithAttachments extends LocalTodo {
	attachments: LocalMedia[];
}

export interface UseTodosDrizzleOptions {
	db: ExpoSQLiteDatabase;
	todosTable: SyncableTable;
	mediaTable: MediaTable;
	mediaAttachmentTable: MediaAttachmentTable;
	scopeId: string;
	filter?: (item: LocalTodo) => boolean;
}

export function useTodosDrizzle({
	db,
	todosTable,
	mediaTable,
	mediaAttachmentTable,
	scopeId,
	filter,
}: UseTodosDrizzleOptions) {
	// 1. Query scoped 2do records from local DB
	const { items, conflicts } = useDrizzleEntity<
		LocalTodo & { fieldClocks: Record<string, string> | string }
	>(db, todosTable, scopeId, filter);

	// 2. Derive 2do IDs for the attachment query
	const todoIds = useMemo(() => (items ?? []).map((t) => t.id), [items]);

	// 3. Query attachments linked to those 2do IDs
	const { data: attachmentRecords } = useLiveQuery(
		todoIds.length > 0
			? db
					.select()
					.from(mediaAttachmentTable)
					.where(inArray(mediaAttachmentTable.entityId, todoIds))
			: db
					.select()
					.from(mediaAttachmentTable)
					.where(eq(mediaAttachmentTable.entityId, "__none__")),
		[todoIds],
	);

	// 4. Derive deduplicated media IDs from the attachments
	const mediaIds = useMemo(() => {
		return [
			...new Set(
				(attachmentRecords ?? []).map(
					(a) => (a as LocalMediaAttachment).mediaId,
				),
			),
		];
	}, [attachmentRecords]);

	// 5. Query media records for those attachment media IDs
	const { data: mediaRecords } = useLiveQuery(
		mediaIds.length > 0
			? db.select().from(mediaTable).where(inArray(mediaTable.id, mediaIds))
			: db.select().from(mediaTable).where(eq(mediaTable.id, "__none__")),
		[mediaIds],
	);

	// 6. Merge todos + attachments + media into a unified list
	const todosWithAttachments: DrizzleTodoWithAttachments[] = useMemo(() => {
		const mediaById = new Map<string, LocalMedia>();
		for (const m of (mediaRecords ?? []) as LocalMedia[]) {
			mediaById.set(m.id, m);
		}

		const byTodo = new Map<string, LocalMedia[]>();
		const sorted = [
			...((attachmentRecords ?? []) as LocalMediaAttachment[]),
		].sort((a, b) => a.position - b.position);
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
