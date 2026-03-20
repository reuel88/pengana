import { getLogger } from "@logtape/logtape";
import {
	findMediaAttachmentsByEntityIds,
	findMediaByEntityIds,
} from "@pengana/db/media-queries";
import type { ScopeType } from "@pengana/db/todo-queries";
import {
	findTodosByIds,
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
	organizationId: string,
	notify?: (id: string) => void,
	skipChanges = false,
) {
	const conflicts: string[] = [];
	const now = new Date();

	logger.debug`Sync started for scope ${scopeType}:${scopeId} by ${createdBy} with ${String(input.changes.length)} change(s)`;

	let appliedCount = 0;

	const changesToProcess = skipChanges ? [] : input.changes;
	const changeIds = changesToProcess.map((c) => c.id);
	const existingTodos = await findTodosByIds(changeIds);

	for (const change of changesToProcess) {
		if (scopeType === "personal") {
			if (change.userId !== scopeId) continue;
		} else {
			if (change.organizationId !== scopeId) continue;
		}

		const existing = existingTodos.get(change.id);

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
				organizationId,
				createdBy,
			});
			appliedCount++;
		} else {
			if (existing.scopeType !== scopeType || existing.scopeId !== scopeId) {
				conflicts.push(change.id);
				continue;
			}

			const clientTime = new Date(change.updatedAt).getTime();
			const serverTime = existing.updatedAt.getTime();

			if (clientTime >= serverTime) {
				await updateTodo(change.id, {
					title: change.title,
					completed: change.completed,
					deleted: change.deleted,
					updatedAt: now,
				});
				appliedCount++;
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
	);

	const todoIds = serverChanges.map((t) => t.id);
	const mediaRows = await findMediaByEntityIds(todoIds);
	const attachmentRows = await findMediaAttachmentsByEntityIds(todoIds);

	// Deduplicate media (a media item may appear multiple times if attached to multiple todos in the result)
	const uniqueMedia = new Map<string, (typeof mediaRows)[number]>();
	for (const row of mediaRows) {
		if (!uniqueMedia.has(row.id)) {
			uniqueMedia.set(row.id, row);
		}
	}

	if (conflicts.length > 0) {
		logger.warn`Sync conflicts for ${scopeType}:${scopeId}: ${String(conflicts.length)} conflict(s) on ids [${conflicts.join(", ")}]`;
	}

	if (appliedCount > 0) {
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
			userId: t.userId,
			organizationId: t.organizationId,
			createdBy: t.createdBy,
			syncStatus: "synced" as const,
		})),
		media: [...uniqueMedia.values()].map((a) => ({
			id: a.id,
			userId: a.userId,
			url: a.url ?? null,
			mimeType: a.mimeType,
			createdAt: a.createdAt.toISOString(),
			updatedAt: a.updatedAt.toISOString(),
			scopeType: a.scopeType,
			scopeId: a.scopeId,
			organizationId: a.organizationId,
			createdBy: a.createdBy,
		})),
		mediaAttachments: attachmentRows.map((att) => ({
			id: att.id,
			mediaId: att.mediaId,
			entityType: att.entityType,
			entityId: att.entityId,
			position: att.position,
			createdAt: att.createdAt.toISOString(),
		})),
		conflicts,
		syncedAt: now.toISOString(),
	};
}
