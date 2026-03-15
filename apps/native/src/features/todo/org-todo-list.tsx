import { useCallback } from "react";

import { useOrgSync } from "@/features/sync/org-sync-context";
import { client } from "@/shared/api/orpc";

import type { TodoItemRow } from "./components/todo-item";
import { useOrgFilePicker } from "./hooks/use-org-file-picker";
import {
	deleteOrgTodo,
	removeOrgMedia,
	resolveOrgConflict,
	toggleOrgTodo,
} from "./org-todo-actions";
import { retryMedia } from "./todo-actions";
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

	const handleRemoveAttachment = useCallback(
		async (attachmentId: string) => {
			await removeOrgMedia(attachmentId);
			client.upload.deleteAttachment({ attachmentId }).catch(() => {});
			triggerSync();
		},
		[triggerSync],
	);

	const handleRetryAttachment = useCallback(
		async (attachmentId: string) => {
			const record = await retryMedia(attachmentId);
			if (record?.localUri && record.entityType && record.entityId) {
				enqueueUpload(
					record.entityType,
					record.entityId,
					record.localUri,
					record.mimeType,
					record.id,
				);
			}
		},
		[enqueueUpload],
	);

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
