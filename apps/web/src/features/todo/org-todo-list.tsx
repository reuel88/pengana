import type { TodoActions, WebOrgTodo } from "@pengana/todo-client";
import {
	attachOrgFile,
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
} from "@pengana/todo-client";
import { useOrgSync } from "@/features/sync/org-sync-context";
import { TodoListConnected } from "./todo-list-connected";

const orgActions: TodoActions = {
	toggleTodo: toggleOrgTodo,
	deleteTodo: deleteOrgTodo,
	resolveConflict: resolveOrgConflict,
	attachFile: attachOrgFile,
};

export function OrgTodoList({ todos }: { todos: WebOrgTodo[] }) {
	const { triggerSync, enqueueUpload } = useOrgSync();

	return (
		<TodoListConnected
			todos={todos}
			triggerSync={triggerSync}
			enqueueUpload={enqueueUpload}
			actions={orgActions}
		/>
	);
}
