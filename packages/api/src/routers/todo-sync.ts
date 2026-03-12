import { getLogger } from "@logtape/logtape";
import {
	findTodoById,
	getTodosUpdatedSince,
	insertTodo,
	updateTodo,
} from "@pengana/db/todo-queries";
import type { SyncInput } from "@pengana/sync-engine";

const logger = getLogger(["app", "sync"]);

export async function handleSync(
	input: SyncInput,
	userId: string,
	notifyUser?: (userId: string) => void,
	isSeated = true,
) {
	const conflicts: string[] = [];
	const now = new Date();

	logger.debug`Sync started for user ${userId} with ${String(input.changes.length)} change(s), seated=${String(isSeated)}`;

	for (const change of isSeated ? input.changes : []) {
		if (change.userId !== userId) continue;

		const existing = await findTodoById(change.id);

		if (!existing) {
			await insertTodo({
				id: change.id,
				title: change.title,
				completed: change.completed,
				deleted: change.deleted,
				attachmentUrl: change.attachmentUrl ?? null,
				updatedAt: now,
				userId,
			});
		} else {
			const clientTime = new Date(change.updatedAt).getTime();
			const serverTime = existing.updatedAt.getTime();

			if (clientTime >= serverTime) {
				await updateTodo(change.id, {
					title: change.title,
					completed: change.completed,
					deleted: change.deleted,
					attachmentUrl: change.attachmentUrl ?? null,
					updatedAt: now,
				});
			} else {
				conflicts.push(change.id);
			}
		}
	}

	const OVERLAP_MS = 5_000;
	const lastSyncedAt = input.lastSyncedAt
		? new Date(new Date(input.lastSyncedAt).getTime() - OVERLAP_MS)
		: new Date(0);

	const serverChanges = await getTodosUpdatedSince(userId, lastSyncedAt);

	if (conflicts.length > 0) {
		logger.warn`Sync conflicts for user ${userId}: ${String(conflicts.length)} conflict(s) on ids [${conflicts.join(", ")}]`;
	}

	if (input.changes.length > 0) {
		notifyUser?.(userId);
	}

	logger.debug`Sync completed for user ${userId}: ${String(serverChanges.length)} server change(s), ${String(conflicts.length)} conflict(s)`;

	return {
		serverChanges: serverChanges.map((t) => ({
			id: t.id,
			title: t.title,
			completed: t.completed,
			deleted: t.deleted,
			attachmentUrl: t.attachmentUrl ?? null,
			updatedAt: t.updatedAt.toISOString(),
			userId: t.userId,
			syncStatus: "synced" as const,
		})),
		conflicts,
		syncedAt: now.toISOString(),
	};
}
