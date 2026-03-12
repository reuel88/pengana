import { getLogger } from "@logtape/logtape";
import {
	findOrgTodoById,
	getOrgTodosUpdatedSince,
	insertOrgTodo,
	updateOrgTodo,
} from "@pengana/db/org-todo-queries";
import type { OrgSyncInput } from "@pengana/sync-engine";

const logger = getLogger(["app", "org-sync"]);

export async function handleOrgSync(
	input: OrgSyncInput,
	organizationId: string,
	createdBy: string,
	notifyOrgMembers?: (orgId: string, excludeUserId: string) => void,
) {
	const conflicts: string[] = [];
	const now = new Date();

	logger.debug`Org sync started for org ${organizationId} by user ${createdBy} with ${String(input.changes.length)} change(s)`;

	for (const change of input.changes) {
		if (change.organizationId !== organizationId) continue;

		const existing = await findOrgTodoById(change.id);

		if (!existing) {
			await insertOrgTodo({
				id: change.id,
				title: change.title,
				completed: change.completed,
				deleted: change.deleted,
				attachmentUrl: change.attachmentUrl ?? null,
				updatedAt: now,
				organizationId,
				createdBy,
			});
		} else {
			const clientTime = new Date(change.updatedAt).getTime();
			const serverTime = existing.updatedAt.getTime();

			if (clientTime >= serverTime) {
				await updateOrgTodo(change.id, {
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

	const serverChanges = await getOrgTodosUpdatedSince(
		organizationId,
		lastSyncedAt,
	);

	if (conflicts.length > 0) {
		logger.warn`Org sync conflicts for org ${organizationId}: ${String(conflicts.length)} conflict(s) on ids [${conflicts.join(", ")}]`;
	}

	if (input.changes.length > 0) {
		notifyOrgMembers?.(organizationId, createdBy);
	}

	logger.debug`Org sync completed for org ${organizationId}: ${String(serverChanges.length)} server change(s), ${String(conflicts.length)} conflict(s)`;

	return {
		serverChanges: serverChanges.map((t) => ({
			id: t.id,
			title: t.title,
			completed: t.completed,
			deleted: t.deleted,
			attachmentUrl: t.attachmentUrl ?? null,
			updatedAt: t.updatedAt.toISOString(),
			organizationId: t.organizationId,
			createdBy: t.createdBy,
			syncStatus: "synced" as const,
		})),
		conflicts,
		syncedAt: now.toISOString(),
	};
}
