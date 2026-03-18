import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import {
	type TodoActions,
	useTodoHandlers,
	type WebTodo,
} from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import type { LocalMedia } from "@pengana/upload-client";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { storeFileInIndexedDB } from "@/features/sync/entities/upload-queue";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

type TodoWithAttachments = WebTodo & {
	attachments: LocalMedia[];
};

interface TodoListProps {
	todos: TodoWithAttachments[];
	syncHook: {
		triggerSync: () => void;
		enqueueUpload: (
			fileUri: string,
			mimeType: string,
			mediaId: string,
			entityType?: string,
			entityId?: string,
			scopeType?: "personal" | "org",
		) => void;
	};
	actions: TodoActions;
	entityType?: string;
	userId?: string;
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
	} = useTodoHandlers({
		triggerSync: syncHook.triggerSync,
		enqueueUpload: syncHook.enqueueUpload,
		onError: handleToastError,
		clearError: () => {}, // no-op: errors are sent to toast, not local state
		fileStorage,
		t,
		deleteAttachment: (attachmentId) =>
			client.upload.deleteMedia({ mediaId: attachmentId }), // Delete attachment is a direct API call
		db: appDb,
		userId,
		scopeType,
		scopeId,
		organizationId,
		entityType,
		actions,
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
