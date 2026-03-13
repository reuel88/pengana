import type { TodoActions, WebOrgTodo } from "@pengana/todo-client";
import {
	attachOrgFile,
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
	attachFile: (id, localUri) => attachOrgFile(appDb, id, localUri),
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
