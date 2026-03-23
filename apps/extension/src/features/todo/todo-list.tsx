import { useTranslation } from "@pengana/i18n";
import {
	createDexieMediaActions,
	getMediaCountForEntity,
	type LocalMedia,
	storeFileInDexie,
} from "@pengana/local-db/media";
import {
	type TodoActions,
	useTodoHandlers,
	type WebTodo,
} from "@pengana/local-db/todo";
import type { EnqueueUploadParams } from "@pengana/sync/upload";
import {
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync/upload";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useMemo, useState } from "react";
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

	const [errors, setErrors] = useState<Record<string, string>>({});

	const onError = useCallback((id: string, message: string) => {
		setErrors((prev) => ({ ...prev, [id]: message }));
	}, []);

	const clearError = useCallback((id: string) => {
		// Destructure to omit the key matching `id`, keeping the rest
		setErrors(({ [id]: _, ...rest }) => rest);
	}, []);

	const fileStorage = useMemo(
		() => ({
			storeFile: (entityId: string, file: File) =>
				storeFileInDexie(appDb, entityId, file),
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
	} = useTodoHandlers({
		triggerSync: syncHook.triggerSync,
		enqueueUpload: syncHook.enqueueUpload,
		onError,
		clearError,
		fileStorage,
		t,
		onDeleteSuccess: clearError,
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
			onValidationError={onError}
			validateFile={(file) => {
				if (!isAllowedMimeType(file.type)) return t("errors:invalidFileType");
				if (file.size > MAX_FILE_SIZE_BYTES) return t("errors:fileTooLarge");
				return null;
			}}
			maxAttachments={MAX_ATTACHMENTS}
			errors={errors}
		/>
	);
}
