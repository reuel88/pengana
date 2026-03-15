import type { TodoActions, WebTodo } from "@pengana/todo-client";
import { createTodoActions, orgTodoConfig } from "@pengana/todo-client";
import type { WebMedia } from "@pengana/upload-client";
import { useOrgSync } from "@/features/sync/sync-context";
import { appDb } from "@/shared/db";
import { TodoListConnected } from "./todo-list-connected";

const todoActions = createTodoActions(appDb, orgTodoConfig);
const orgActions: TodoActions = {
	toggleTodo: (id) => todoActions.toggleTodo(id),
	deleteTodo: (id) => todoActions.deleteTodo(id),
	resolveConflict: (id, resolution) =>
		todoActions.resolveConflict(id, resolution),
};

export function OrgTodoList({
	todos,
	userId,
}: {
	todos: (WebTodo & { attachments: WebMedia[] })[];
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
