import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import type { TodoActions, TodoConfig, WebTodo } from "@pengana/todo-client";
import { useTodoListWiring } from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import type { WebMedia } from "@pengana/upload-client";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { storeFileInIndexedDB } from "@/features/sync/entities/upload-queue";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

export function TodoListConnected({
	todos,
	triggerSync,
	enqueueUpload,
	actions,
	entityType,
	userId,
	config,
}: {
	todos: (WebTodo & { attachments: WebMedia[] })[];
	triggerSync: () => void;
	enqueueUpload: (
		entityType: string,
		entityId: string,
		fileUri: string,
		mimeType: string,
		mediaId: string,
	) => void;
	actions?: TodoActions;
	entityType?: string;
	userId?: string;
	config?: TodoConfig;
}) {
	const { t } = useTranslation();

	const handleToastError = useCallback((_id: string, msg: string) => {
		toast.error(msg);
	}, []);

	const fileStorage = useMemo(
		() => ({
			storeFile: storeFileInIndexedDB,
			createFileRef: (id: string) => ({
				uri: `${INDEXEDDB_URI_PREFIX}${id}`,
			}),
		}),
		[],
	);

	const {
		handleToggle,
		handleDelete,
		handleResolve,
		handleRemoveAttachment,
		handleFilesSelected,
	} = useTodoListWiring({
		triggerSync,
		enqueueUpload,
		onError: handleToastError,
		clearError: () => {}, // no-op: errors are sent to toast, not local state
		fileStorage,
		t,
		actions,
		deleteAttachment: (attachmentId) =>
			client.upload.deleteAttachment({ attachmentId }),
		db: appDb,
		entityType,
		userId,
		config,
	});

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFilesSelected={handleFilesSelected}
			onRemoveAttachment={handleRemoveAttachment}
			onValidationError={handleToastError}
		/>
	);
}
