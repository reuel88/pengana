import type { SyncAdapter, Todo } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

import { todoDb } from "../lib/db";

export function createDexieOrgSyncAdapter(organizationId: string): SyncAdapter {
	return {
		async getPendingChanges(): Promise<Todo[]> {
			const rows = await todoDb.orgTodos
				.where({ userId: organizationId, syncStatus: "pending" })
				.toArray();
			return rows.map(({ attachmentLocalUri, attachmentStatus, ...todo }) => ({
				...todo,
				attachmentUrl: todo.attachmentUrl ?? null,
			}));
		},

		async applyServerChanges(
			todos: Todo[],
			conflictIds: string[] = [],
		): Promise<void> {
			const conflictSet = new Set(conflictIds);
			try {
				await todoDb.transaction("rw", todoDb.orgTodos, async () => {
					for (const serverTodo of todos) {
						const local = await todoDb.orgTodos.get(serverTodo.id);
						const isConflict = conflictSet.has(serverTodo.id);
						if (!local || local.syncStatus !== "pending" || isConflict) {
							await todoDb.orgTodos.put({
								...serverTodo,
								// Map server fields to Dexie schema
								organizationId:
									(serverTodo as Todo & { organizationId?: string })
										.organizationId ?? serverTodo.userId,
								createdBy:
									(serverTodo as Todo & { createdBy?: string | null })
										.createdBy ?? null,
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
			await todoDb.transaction("rw", todoDb.orgTodos, async () => {
				for (const item of pushedItems) {
					const local = await todoDb.orgTodos.get(item.id);
					if (local && local.updatedAt === item.updatedAt) {
						await todoDb.orgTodos.update(item.id, { syncStatus: "synced" });
					}
				}
			});
		},

		async markAsConflict(ids: string[]): Promise<void> {
			await todoDb.transaction("rw", todoDb.orgTodos, async () => {
				for (const id of ids) {
					await todoDb.orgTodos.update(id, { syncStatus: "conflict" });
				}
			});
		},

		async getLastSyncedAt(): Promise<string | null> {
			const meta = await todoDb.syncMeta.get(
				`lastSyncedAt:org:${organizationId}`,
			);
			return meta?.value ?? null;
		},

		async setLastSyncedAt(timestamp: string): Promise<void> {
			await todoDb.syncMeta.put({
				key: `lastSyncedAt:org:${organizationId}`,
				value: timestamp,
			});
		},
	};
}
