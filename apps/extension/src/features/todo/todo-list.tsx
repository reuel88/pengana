import { useTranslation } from "@pengana/i18n";
import {
	createDexieMediaActions,
	getMediaCountForEntity,
	type LocalMedia,
	storeFileInDexie,
} from "@pengana/local-db/media";
import {
	type LocalTodo,
	type TodoActions,
	useTodoHandlers,
} from "@pengana/local-db/todo";
import type { EnqueueUploadParams } from "@pengana/sync/upload";
import {
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync/upload";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useMemo, useState } from "react";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

type TodoWithAttachments = LocalTodo & {
	attachments: LocalMedia[];
};

interface TodoListProps {
	todos: TodoWithAttachments[];
	syncHook: {
		triggerSync: () => void;
		enqueueUpload: (params: EnqueueUploadParams) => void;
	};
	actions: TodoActions;
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
		handleAdd,
		handleToggle,
		handleDelete,
		handleResolve,
		handleRemoveAttachment,
		handleFileSelected,
	} = useTodoHandlers({
		fileStorage,
		t,
		userId,
		scopeType,
		scopeId,
		organizationId,
		actions,
		mediaActions,
	});

	const { triggerSync, enqueueUpload } = syncHook;

	return (
		<div className="flex flex-col gap-4">
			<TodoInputBase
				onSubmit={async (title) => {
					const result = await handleAdd(title);
					if (result.success) {
						triggerSync();
					} else {
						onError("add-todo", result.error);
					}
				}}
			/>
			<TodoListBase
				todos={todos}
				onToggle={async (id) => {
					clearError(id);
					const result = await handleToggle(id);
					if (!result.success) onError(id, result.error);
					triggerSync();
				}}
				onDelete={async (id) => {
					clearError(id);
					const result = await handleDelete(id);
					if (!result.success) onError(id, result.error);
					triggerSync();
				}}
				onResolve={async (id, resolution) => {
					clearError(id);
					const result = await handleResolve(id, resolution);
					if (!result.success) onError(id, result.error);
					triggerSync();
				}}
				onFilesSelected={async (files, target) => {
					clearError(target.entityId);
					const currentCount = await getMediaCountForEntity(
						appDb,
						target.entityId,
					);
					const available = MAX_ATTACHMENTS - currentCount;
					const sliced = files.slice(0, available);
					let enqueued = false;
					for (const file of sliced) {
						const result = await handleFileSelected(file, target);
						if (result.success) {
							enqueueUpload(result.data);
							enqueued = true;
						} else {
							onError(target.entityId, result.error);
						}
					}
					if (enqueued) {
						triggerSync();
					}
				}}
				onRemoveAttachment={async (todoId, attachmentId) => {
					clearError(todoId);
					const result = await handleRemoveAttachment(todoId, attachmentId);
					if (result.success) {
						try {
							await client.upload.deleteMedia({ mediaId: attachmentId });
						} catch {
							// server-side cleanup failed; local removal already succeeded
						}
					} else {
						onError(todoId, result.error);
					}
					triggerSync();
				}}
				onValidationError={onError}
				validateFile={(file) => {
					if (!isAllowedMimeType(file.type)) return t("errors:invalidFileType");
					if (file.size > MAX_FILE_SIZE_BYTES) return t("errors:fileTooLarge");
					return null;
				}}
				maxAttachments={MAX_ATTACHMENTS}
				errors={errors}
			/>
		</div>
	);
}
