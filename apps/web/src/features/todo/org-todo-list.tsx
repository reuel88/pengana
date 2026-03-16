import type { WebTodo } from "@pengana/todo-client";
import { createTodoActions, orgTodoConfig } from "@pengana/todo-client";
import type { WebMedia } from "@pengana/upload-client";
import { useOrgSync } from "@/features/sync/sync-context";
import { appDb } from "@/shared/db";
import { TodoListConnected } from "./todo-list-connected";

const orgActions = createTodoActions(appDb, orgTodoConfig);

export function OrgTodoList({
	todos,
	userId,
	organizationId,
}: {
	todos: (WebTodo & { attachments: WebMedia[] })[];
	userId: string;
	organizationId: string;
}) {
	const { triggerSync, enqueueUpload } = useOrgSync();

	return (
		<TodoListConnected
			todos={todos}
			triggerSync={triggerSync}
			enqueueUpload={enqueueUpload}
			actions={orgActions}
			entityType="todo"
			userId={userId}
			scopeType="org"
			scopeId={organizationId}
			organizationId={organizationId}
		/>
	);
}
