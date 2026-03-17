import type { WebTodo } from "@pengana/todo-client";
import { personalTodoConfig } from "@pengana/todo-client";
import type { LocalMedia } from "@pengana/upload-client";
import { useSync } from "@/features/sync/sync-context";
import { TodoListConnected } from "./todo-list-connected";

export function TodoList({
	todos,
	userId,
	organizationId,
}: {
	todos: (WebTodo & { attachments: LocalMedia[] })[];
	userId: string;
	organizationId?: string;
}) {
	const { triggerSync, enqueueUpload } = useSync();

	return (
		<TodoListConnected
			todos={todos}
			triggerSync={triggerSync}
			enqueueUpload={enqueueUpload}
			userId={userId}
			config={personalTodoConfig}
			scopeType="personal"
			scopeId={userId}
			organizationId={organizationId ?? null}
		/>
	);
}
