// Org-scoped todo actions — own HLC for add; re-exports mutations from todo-actions
import { HLC, serializeHlc } from "@pengana/sync/core";
import { randomUUID } from "expo-crypto";
import { actions } from "./todo-actions";

const hlc = new HLC(randomUUID());

export {
	deleteTodo as deleteOrgTodo,
	resolveConflict as resolveOrgConflict,
	toggleTodo as toggleOrgTodo,
} from "./todo-actions";

export async function addOrgTodo(
	organizationId: string,
	userId: string,
	title: string,
): Promise<void> {
	const ts = serializeHlc(hlc.now());
	await actions.add({
		id: randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		hlcTimestamp: ts,
		fieldClocks: JSON.stringify({ title: ts, completed: ts, deleted: ts }),
		userId,
		scopeId: organizationId,
		organizationId,
		createdBy: userId,
		scopeType: "org",
		syncStatus: "pending",
		deleted: false,
	});
}
