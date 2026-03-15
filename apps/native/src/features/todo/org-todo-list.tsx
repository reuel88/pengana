import { useOrgSync } from "@/features/sync/org-sync-context";

import type { TodoItemRow } from "./components/todo-item";
import { useAttachmentHandlers } from "./create-attachment-handlers";
import { useOrgFilePicker } from "./hooks/use-org-file-picker";
import {
	deleteOrgTodo,
	removeOrgMedia,
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

export function OrgTodoList({
	todos,
	userId,
}: {
	todos: TodoItemRow[];
	userId: string;
}) {
	const { triggerSync, enqueueUpload } = useOrgSync();
	const { showPickerForTodo } = useOrgFilePicker(userId);
	const { handleRemoveAttachment, handleRetryAttachment } =
		useAttachmentHandlers(removeOrgMedia, triggerSync, enqueueUpload);

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
