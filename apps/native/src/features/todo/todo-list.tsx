import { useSync } from "@/features/sync/sync-context";

import type { TodoItemRow } from "./components/todo-item";
import { useAttachmentHandlers } from "./create-attachment-handlers";
import { useFilePicker } from "./hooks/use-file-picker";
import {
	deleteTodo,
	removeMedia,
	resolveConflict,
	toggleTodo,
} from "./todo-actions";
import type { TodoListActions } from "./todo-list-base";
import { TodoListBase } from "./todo-list-base";

export type { TodoItemRow };

const actions: TodoListActions = { toggleTodo, deleteTodo, resolveConflict };

export function TodoList({
	todos,
	userId,
}: {
	todos: TodoItemRow[];
	userId: string;
}) {
	const { triggerSync, enqueueUpload } = useSync();
	const { showPickerForTodo } = useFilePicker(userId);
	const { handleRemoveAttachment, handleRetryAttachment } =
		useAttachmentHandlers(removeMedia, triggerSync, enqueueUpload);

	return (
		<TodoListBase
			todos={todos}
			triggerSync={triggerSync}
			showPickerForTodo={showPickerForTodo}
			actions={actions}
			onRemoveAttachment={handleRemoveAttachment}
			onRetryAttachment={handleRetryAttachment}
		/>
	);
}
