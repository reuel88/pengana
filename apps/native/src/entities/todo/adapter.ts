import type { SyncAdapter, Todo } from "@finance-tool-poc/sync-engine";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "./db";
import { syncMeta, todos } from "./schema";

export function createDrizzleSyncAdapter(userId: string): SyncAdapter {
	return {
		async getPendingChanges(): Promise<Todo[]> {
			const rows = await db
				.select()
				.from(todos)
				.where(and(eq(todos.userId, userId), eq(todos.syncStatus, "pending")));

			return rows.map(rowToTodo);
		},

		async applyServerChanges(
			serverTodos: Todo[],
			conflictIds: string[] = [],
		): Promise<void> {
			const conflictSet = new Set(conflictIds);
			for (const serverTodo of serverTodos) {
				const [local] = await db
					.select()
					.from(todos)
					.where(eq(todos.id, serverTodo.id));

				const isConflict = conflictSet.has(serverTodo.id);
				if (!local || local.syncStatus !== "pending" || isConflict) {
					await db
						.insert(todos)
						.values(todoToRow(serverTodo, isConflict ? "conflict" : "synced"))
						.onConflictDoUpdate({
							target: todos.id,
							set: todoToRow(serverTodo, isConflict ? "conflict" : "synced"),
						});
				}
			}
		},

		async markAsSynced(pushedItems: Todo[]): Promise<void> {
			for (const item of pushedItems) {
				const [local] = await db
					.select()
					.from(todos)
					.where(eq(todos.id, item.id));
				if (local && local.updatedAt === item.updatedAt) {
					await db
						.update(todos)
						.set({ syncStatus: "synced" })
						.where(eq(todos.id, item.id));
				}
			}
		},

		async markAsConflict(ids: string[]): Promise<void> {
			if (ids.length === 0) return;
			await db
				.update(todos)
				.set({ syncStatus: "conflict" })
				.where(inArray(todos.id, ids));
		},

		async getLastSyncedAt(): Promise<string | null> {
			const [row] = await db
				.select()
				.from(syncMeta)
				.where(eq(syncMeta.key, `lastSyncedAt:${userId}`));
			return row?.value ?? null;
		},

		async setLastSyncedAt(timestamp: string): Promise<void> {
			await db
				.insert(syncMeta)
				.values({ key: `lastSyncedAt:${userId}`, value: timestamp })
				.onConflictDoUpdate({
					target: syncMeta.key,
					set: { value: timestamp },
				});
		},
	};
}

function rowToTodo(row: typeof todos.$inferSelect): Todo {
	return {
		id: row.id,
		title: row.title,
		completed: row.completed,
		updatedAt: row.updatedAt,
		userId: row.userId,
		syncStatus: row.syncStatus,
		deleted: row.deleted,
		attachmentUrl: row.attachmentUrl ?? null,
	};
}

function todoToRow(todo: Todo, syncStatus: string) {
	return {
		id: todo.id,
		title: todo.title,
		completed: todo.completed,
		updatedAt: todo.updatedAt,
		userId: todo.userId,
		syncStatus: syncStatus as "synced" | "pending" | "conflict",
		deleted: todo.deleted,
		attachmentUrl: todo.attachmentUrl ?? null,
	};
}
