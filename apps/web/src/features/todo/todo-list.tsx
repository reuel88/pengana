import type { WebTodo } from "@pengana/todo-client";
import { useSync } from "@/features/sync/sync-context";
import { TodoListConnected } from "./todo-list-connected";

export function TodoList({ todos }: { todos: WebTodo[] }) {
	const { triggerSync, enqueueUpload } = useSync();

	return (
		<TodoListConnected
			todos={todos}
			triggerSync={triggerSync}
			enqueueUpload={enqueueUpload}
		/>
	);
}
