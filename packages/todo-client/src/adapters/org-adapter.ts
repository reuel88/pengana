import {
	createDexieSyncAdapter as createGenericAdapter,
	type EntityDatabase,
} from "@pengana/entity-store";
import type { SyncAdapter, Todo } from "@pengana/sync-engine";

import type { WebOrgTodo } from "../lib/db";

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
		): WebOrgTodo => ({
			...wire,
			organizationId:
				(wire as Todo & { organizationId?: string }).organizationId ??
				wire.userId,
			createdBy:
				(wire as Todo & { createdBy?: string | null }).createdBy ?? null,
			syncStatus,
			attachmentLocalUri: existing?.attachmentLocalUri ?? null,
			attachmentStatus: existing?.attachmentStatus ?? null,
		}),
	});
}
