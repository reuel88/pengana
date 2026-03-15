import { useCallback } from "react";

import { useSync } from "@/features/sync/sync-context";
import { client } from "@/shared/api/orpc";

import type { TodoItemRow } from "./components/todo-item";
import { useFilePicker } from "./hooks/use-file-picker";
import {
	deleteTodo,
	removeMedia,
	resolveConflict,
	retryMedia,
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

	const handleRemoveAttachment = useCallback(
		async (attachmentId: string) => {
			await removeMedia(attachmentId);
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
