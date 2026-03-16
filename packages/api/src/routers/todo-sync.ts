import { getLogger } from "@logtape/logtape";
import { findMediaByEntityIds } from "@pengana/db/media-queries";
import type { ScopeType } from "@pengana/db/todo-queries";
import {
	findTodoById,
	getTodosUpdatedSince,
	insertTodo,
	updateTodo,
} from "@pengana/db/todo-queries";
import type { SyncInput } from "@pengana/sync-engine";

const logger = getLogger(["app", "sync"]);

export async function handleTodoSync(
	input: SyncInput,
	scopeType: ScopeType,
	scopeId: string,
	createdBy: string,
	notify?: (id: string) => void,
	skipChanges = false,
	organizationId?: string,
) {
	const conflicts: string[] = [];
	const now = new Date();

	logger.debug`Sync started for scope ${scopeType}:${scopeId} by ${createdBy} with ${String(input.changes.length)} change(s)`;

	for (const change of skipChanges ? [] : input.changes) {
		if (scopeType === "personal") {
			if (change.userId !== scopeId) continue;
		} else {
			if (change.organizationId !== scopeId) continue;
			if (change.createdBy !== createdBy) continue;
		}

		const existing = await findTodoById(change.id);

		if (!existing) {
			await insertTodo({
				id: change.id,
				title: change.title,
				completed: change.completed,
				deleted: change.deleted,
				updatedAt: now,
				scopeType,
				scopeId,
				userId: createdBy,
				organizationId:
					scopeType === "org"
						? scopeId
						: (organizationId ?? (change.organizationId || null)),
				createdBy,
			});
		} else {
			const clientTime = new Date(change.updatedAt).getTime();
			const serverTime = existing.updatedAt.getTime();

			if (clientTime >= serverTime) {
				await updateTodo(change.id, {
					title: change.title,
					completed: change.completed,
					deleted: change.deleted,
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

	const serverChanges = await getTodosUpdatedSince(
		scopeType,
		scopeId,
		lastSyncedAt,
		organizationId,
	);

	const todoIds = serverChanges.map((t) => t.id);
	const mediaRows = await findMediaByEntityIds(todoIds);

	if (conflicts.length > 0) {
		logger.warn`Sync conflicts for ${scopeType}:${scopeId}: ${String(conflicts.length)} conflict(s) on ids [${conflicts.join(", ")}]`;
	}

	if (input.changes.length > 0) {
		notify?.(scopeId);
	}

	logger.debug`Sync completed for ${scopeType}:${scopeId}: ${String(serverChanges.length)} server change(s), ${String(conflicts.length)} conflict(s)`;

	return {
		serverChanges: serverChanges.map((t) => ({
			id: t.id,
			title: t.title,
			completed: t.completed,
			deleted: t.deleted,
			updatedAt: t.updatedAt.toISOString(),
			userId: scopeType === "personal" ? t.scopeId : t.scopeId,
			organizationId:
				scopeType === "org" ? t.scopeId : (t.organizationId ?? ""),
			createdBy: t.createdBy ?? null,
			syncStatus: "synced" as const,
		})),
		media: mediaRows.map((a) => ({
			id: a.id,
			entityId: a.entityId,
			entityType: a.entityType,
			userId: a.userId,
			url: a.url ?? null,
			mimeType: a.mimeType,
			position: a.position,
			createdAt: a.createdAt.toISOString(),
		})),
		conflicts,
		syncedAt: now.toISOString(),
	};
}
