import type { TodoActions, WebMedia, WebOrgTodo } from "@pengana/todo-client";
import {
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
} from "@pengana/todo-client";
import { useOrgSync } from "@/features/sync/org-sync-context";
import { appDb } from "@/shared/db";
import { TodoListConnected } from "./todo-list-connected";

const orgActions: TodoActions = {
	toggleTodo: (id) => toggleOrgTodo(appDb, id),
	deleteTodo: (id) => deleteOrgTodo(appDb, id),
	resolveConflict: (id, resolution) =>
		resolveOrgConflict(appDb, id, resolution),
};

export function OrgTodoList({
	todos,
	userId,
}: {
	todos: (WebOrgTodo & { attachments: WebMedia[] })[];
	userId: string;
}) {
	const { triggerSync, enqueueUpload } = useOrgSync();

	return (
		<TodoListConnected
			todos={todos}
			triggerSync={triggerSync}
			enqueueUpload={enqueueUpload}
			actions={orgActions}
			entityType="orgTodo"
			userId={userId}
		/>
	);
}
