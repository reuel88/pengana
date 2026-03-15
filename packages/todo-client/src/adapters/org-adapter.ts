import {
	createDexieSyncAdapter as createGenericAdapter,
	type EntityDatabase,
} from "@pengana/entity-store";
import type { SyncAdapter, Todo } from "@pengana/sync-engine";

import type { WebOrgTodo } from "../lib/db";

function toBaseLocalTodo(
	wire: Todo,
	syncStatus: "synced" | "conflict",
): WebOrgTodo {
	return {
		id: wire.id,
		title: wire.title,
		completed: wire.completed,
		updatedAt: wire.updatedAt,
		userId: wire.userId,
		organizationId:
			(wire as Todo & { organizationId?: string }).organizationId ??
			wire.userId,
		createdBy: (wire as Todo & { createdBy?: string | null }).createdBy ?? null,
		syncStatus,
		deleted: wire.deleted,
	};
}

export function createDexieOrgSyncAdapter(
	db: EntityDatabase,
	organizationId: string,
): SyncAdapter {
	return createGenericAdapter<WebOrgTodo>(organizationId, {
		db,
		tableName: "orgTodos",
		syncKeyPrefix: "lastSyncedAt:org",
		toWire: (local: WebOrgTodo): Todo => ({
			id: local.id,
			title: local.title,
			completed: local.completed,
			updatedAt: local.updatedAt,
			userId: local.userId,
			syncStatus: local.syncStatus,
			deleted: local.deleted,
		}),
		toLocal: (
			wire: Todo,
			existing: WebOrgTodo | undefined,
			syncStatus: "synced" | "conflict",
		): WebOrgTodo => {
			const base = toBaseLocalTodo(wire, syncStatus);

			if (syncStatus !== "conflict" || !existing) {
				return base;
			}

			return {
				...base,
				title: existing.title,
				completed: existing.completed,
				updatedAt: existing.updatedAt,
				deleted: existing.deleted,
			};
		},
	});
}
