import { useOrgSync } from "@/features/sync/org-sync-context";

import type { TodoItemRow } from "./components/todo-item";
import { useOrgFilePicker } from "./hooks/use-org-file-picker";
import {
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
} from "./org-todo-actions";
import type { TodoListActions } from "./todo-list-base";
import { TodoListBase } from "./todo-list-base";

const actions: TodoListActions = {
	toggleTodo: toggleOrgTodo,
	deleteTodo: deleteOrgTodo,
	resolveConflict: resolveOrgConflict,
};

export function OrgTodoList({ todos }: { todos: TodoItemRow[] }) {
	const { triggerSync } = useOrgSync();
	const { showPickerForTodo } = useOrgFilePicker();

	return (
		<TodoListBase
			todos={todos}
			triggerSync={triggerSync}
			showPickerForTodo={showPickerForTodo}
			actions={actions}
		/>
	);
}
