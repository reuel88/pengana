import type { EnqueueUploadParams } from "@pengana/sync/upload";
import type { TodoItemRow } from "./components/todo-item";
import { useAttachmentHandlers } from "./create-attachment-handlers";
import { useFilePickerBase } from "./hooks/use-file-picker-base";
import {
	addMedia,
	attachMedia,
	getMediaCountForEntity,
	removeMedia,
	updateMediaLocalUri,
} from "./todo-actions";
import type { TodoListActions } from "./todo-list-base";
import { TodoListBase } from "./todo-list-base";

export type { TodoItemRow };

interface TodoListProps {
	todos: TodoItemRow[];
	syncHook: {
		triggerSync: () => void;
		enqueueUpload: (params: EnqueueUploadParams) => void;
	};
	actions: TodoListActions;
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
}

export function TodoList({
	todos,
	syncHook,
	actions,
	userId,
	scopeType,
	scopeId,
	organizationId,
}: TodoListProps) {
	const { showPickerForTodo } = useFilePickerBase({
		addMedia,
		attachMedia,
		updateMediaLocalUri,
		enqueueUpload: syncHook.enqueueUpload,
		getMediaCount: getMediaCountForEntity,
		entityType: "todo",
		userId,
		scopeType,
		scopeId,
		organizationId,
		createdBy: userId,
	});

	const { handleRemoveAttachment, handleRetryAttachment } =
		useAttachmentHandlers(
			removeMedia,
			syncHook.triggerSync,
			syncHook.enqueueUpload,
		);

	return (
		<TodoListBase
			todos={todos}
			triggerSync={syncHook.triggerSync}
			showPickerForTodo={showPickerForTodo}
			actions={actions}
			onRemoveAttachment={handleRemoveAttachment}
			onRetryAttachment={handleRetryAttachment}
		/>
	);
}
