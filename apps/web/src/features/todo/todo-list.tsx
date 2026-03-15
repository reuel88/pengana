import type { WebTodo } from "@pengana/todo-client";
import { personalTodoConfig } from "@pengana/todo-client";
import type { WebMedia } from "@pengana/upload-client";
import { useSync } from "@/features/sync/sync-context";
import { TodoListConnected } from "./todo-list-connected";

export function TodoList({
	todos,
	userId,
}: {
	todos: (WebTodo & { attachments: WebMedia[] })[];
	userId: string;
}) {
	const { triggerSync, enqueueUpload } = useSync();

	return (
		<TodoListConnected
			todos={todos}
			triggerSync={triggerSync}
			enqueueUpload={enqueueUpload}
			userId={userId}
			config={personalTodoConfig}
		/>
	);
}
