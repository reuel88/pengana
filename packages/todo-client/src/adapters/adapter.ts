import type { SyncAdapter, Todo } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

import { todoDb } from "../lib/db";

export function createDexieSyncAdapter(userId: string): SyncAdapter {
	return {
		async getPendingChanges(): Promise<Todo[]> {
			const rows = await todoDb.todos
				.where({ userId, syncStatus: "pending" })
				.toArray();
			return rows.map(({ attachmentLocalUri, attachmentStatus, ...todo }) => ({
				...todo,
				// Coalesce undefined → null so the sync-engine Todo type is satisfied
				// (Todo.attachmentUrl is `string | null`, not optional)
				attachmentUrl: todo.attachmentUrl ?? null,
			}));
		},

		async applyServerChanges(
			todos: Todo[],
			conflictIds: string[] = [],
		): Promise<void> {
			const conflictSet = new Set(conflictIds);
			try {
				await todoDb.transaction("rw", todoDb.todos, async () => {
					for (const serverTodo of todos) {
						const local = await todoDb.todos.get(serverTodo.id);
						const isConflict = conflictSet.has(serverTodo.id);
						if (!local || local.syncStatus !== "pending" || isConflict) {
							await todoDb.todos.put({
								...serverTodo,
								syncStatus: isConflict ? "conflict" : "synced",
								attachmentLocalUri: local?.attachmentLocalUri ?? null,
								attachmentStatus: local?.attachmentStatus ?? null,
							});
						}
					}
				});
			} catch (e) {
				if (isQuotaError(e)) throw new StorageFullError();
				throw e;
			}
		},

		async markAsSynced(pushedItems: Todo[]): Promise<void> {
			await todoDb.transaction("rw", todoDb.todos, async () => {
				for (const item of pushedItems) {
					const local = await todoDb.todos.get(item.id);
					if (local && local.updatedAt === item.updatedAt) {
						await todoDb.todos.update(item.id, { syncStatus: "synced" });
					}
				}
			});
		},

		async markAsConflict(ids: string[]): Promise<void> {
			await todoDb.transaction("rw", todoDb.todos, async () => {
				for (const id of ids) {
					await todoDb.todos.update(id, { syncStatus: "conflict" });
				}
			});
		},

		async getLastSyncedAt(): Promise<string | null> {
			const meta = await todoDb.syncMeta.get(`lastSyncedAt:${userId}`);
			return meta?.value ?? null;
		},

		async setLastSyncedAt(timestamp: string): Promise<void> {
			await todoDb.syncMeta.put({
				key: `lastSyncedAt:${userId}`,
				value: timestamp,
			});
		},
	};
}
