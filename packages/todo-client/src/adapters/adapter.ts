import {
	createDexieSyncAdapter as createGenericAdapter,
	type EntityDatabase,
} from "@pengana/entity-store";
import type { SyncAdapter, Todo } from "@pengana/sync-engine";

import type { WebTodo } from "../lib/db";

export function createDexieSyncAdapter(
	db: EntityDatabase,
	userId: string,
): SyncAdapter {
	return createGenericAdapter<WebTodo>(userId, {
		db,
		tableName: "todos",
		syncKeyPrefix: "lastSyncedAt",
		toWire: (local: WebTodo): Todo => {
			const { attachmentLocalUri: _, attachmentStatus: __, ...todo } = local;
			return {
				...todo,
				attachmentUrl: todo.attachmentUrl ?? null,
			};
		},
		toLocal: (
			wire: Todo,
			existing: WebTodo | undefined,
			syncStatus: "synced" | "conflict",
		): WebTodo => ({
			...wire,
			syncStatus,
			attachmentLocalUri: existing?.attachmentLocalUri ?? null,
			attachmentStatus: existing?.attachmentStatus ?? null,
		}),
	});
}
