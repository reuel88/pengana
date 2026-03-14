import { useSync } from "@/features/sync/sync-context";

import type { TodoItemRow } from "./components/todo-item";
import { useFilePicker } from "./hooks/use-file-picker";
import { deleteTodo, resolveConflict, toggleTodo } from "./todo-actions";
import type { TodoListActions } from "./todo-list-base";
import { TodoListBase } from "./todo-list-base";

export type { TodoItemRow };

const actions: TodoListActions = { toggleTodo, deleteTodo, resolveConflict };

export function TodoList({ todos }: { todos: TodoItemRow[] }) {
	const { triggerSync } = useSync();
	const { showPickerForTodo } = useFilePicker();

	return (
		<TodoListBase
			todos={todos}
			triggerSync={triggerSync}
			showPickerForTodo={showPickerForTodo}
			actions={actions}
		/>
	);
}
