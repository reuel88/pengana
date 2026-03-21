import { useTranslation } from "@pengana/i18n";
import {
	type TodoActions,
	useTodoHandlers,
	type WebTodo,
} from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import type { LocalMedia } from "@pengana/upload-client";
import {
	createDexieMediaActions,
	getMediaCountForEntity,
} from "@pengana/upload-client";
import type { EnqueueUploadParams } from "@pengana/upload-queue";
import { INDEXEDDB_URI_PREFIX } from "@pengana/upload-queue";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { storeFileInDexie } from "@/features/upload-queue";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

type TodoWithAttachments = WebTodo & {
	attachments: LocalMedia[];
};

interface TodoListProps {
	todos: TodoWithAttachments[];
	syncHook: {
		triggerSync: () => void;
		enqueueUpload: (params: EnqueueUploadParams) => void;
	};
	actions: TodoActions;
	entityType?: string;
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
}

export function TodoList({
	todos,
	syncHook,
	actions,
	entityType,
	userId,
	scopeType,
	scopeId,
	organizationId,
}: TodoListProps) {
	const { t } = useTranslation();

	const handleToastError = useCallback((_id: string, msg: string) => {
		toast.error(msg);
	}, []);

	const fileStorage = useMemo(
		() => ({
			storeFile: storeFileInDexie,
			createFileRef: (id: string) => ({
				uri: `${INDEXEDDB_URI_PREFIX}${id}`,
			}),
		}),
		[],
	);

	const mediaActions = useMemo(() => createDexieMediaActions(appDb), []);

	const {
		handleToggle,
		handleDelete,
		handleResolve,
		handleRemoveAttachment,
		handleFilesSelected,
		handleRetry,
	} = useTodoHandlers({
		triggerSync: syncHook.triggerSync,
		enqueueUpload: syncHook.enqueueUpload,
		onError: handleToastError,
		clearError: () => {}, // no-op: errors are sent to toast, not local state
		fileStorage,
		t,
		deleteAttachment: (attachmentId) =>
			client.upload.deleteMedia({ mediaId: attachmentId }), // Delete attachment is a direct API call
		userId,
		scopeType,
		scopeId,
		organizationId,
		entityType,
		actions,
		mediaActions,
		getMediaCountForEntity: (entityId) =>
			getMediaCountForEntity(appDb, entityId),
	});

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFilesSelected={handleFilesSelected}
			onRemoveAttachment={handleRemoveAttachment}
			onRetryAttachment={(_todoId, attachmentId) => handleRetry(attachmentId)}
			onValidationError={handleToastError}
		/>
	);
}
