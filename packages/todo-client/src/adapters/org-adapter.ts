import {
	createDexieSyncAdapter as createGenericAdapter,
	type EntityDatabase,
} from "@pengana/entity-store";
import type { SyncAdapter, Todo } from "@pengana/sync-engine";

import type { WebOrgTodo } from "../lib/db";

function toBaseLocalTodo(
	wire: Todo,
	existing: WebOrgTodo | undefined,
	syncStatus: "synced" | "conflict",
): WebOrgTodo {
	return {
		...wire,
		organizationId:
			(wire as Todo & { organizationId?: string }).organizationId ??
			wire.userId,
		createdBy: (wire as Todo & { createdBy?: string | null }).createdBy ?? null,
		syncStatus,
		attachmentLocalUri: existing?.attachmentLocalUri ?? null,
		attachmentStatus: existing?.attachmentStatus ?? null,
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
		toWire: (local: WebOrgTodo): Todo => {
			const {
				attachmentLocalUri: _,
				attachmentStatus: __,
				organizationId: ___,
				createdBy: ____,
				...todo
			} = local;
			return {
				...todo,
				attachmentUrl: todo.attachmentUrl ?? null,
			};
		},
		toLocal: (
			wire: Todo,
			existing: WebOrgTodo | undefined,
			syncStatus: "synced" | "conflict",
		): WebOrgTodo => {
			const base = toBaseLocalTodo(wire, existing, syncStatus);

			if (syncStatus !== "conflict" || !existing) {
				return base;
			}

			return {
				...base,
				title: existing.title,
				completed: existing.completed,
				updatedAt: existing.updatedAt,
				deleted: existing.deleted,
				attachmentUrl: existing.attachmentUrl,
				attachmentLocalUri: existing.attachmentLocalUri,
				attachmentStatus: existing.attachmentStatus,
			};
		},
	});
}
