import { createDexieActions } from "@pengana/local-db/dexie";
import type { WebTodo } from "@pengana/local-db/todo";
import { HLC, serializeHlc } from "@pengana/sync/core";

import { appDb } from "@/shared/db";

const hlc = new HLC(crypto.randomUUID());

const actions = createDexieActions<WebTodo>(appDb, "todos", {
	hlcNow: () => hlc.now(),
});

export async function addOrgTodo(
	organizationId: string,
	userId: string,
	title: string,
): Promise<void> {
	const ts = serializeHlc(hlc.now());
	await actions.add({
		id: crypto.randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		hlcTimestamp: ts,
		fieldClocks: { title: ts, completed: ts, deleted: ts },
		scopeId: organizationId,
		userId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "org",
	});
}

export {
	deleteTodo as deleteOrgTodo,
	resolveConflict as resolveOrgConflict,
	toggleTodo as toggleOrgTodo,
} from "./todo-actions.web";
