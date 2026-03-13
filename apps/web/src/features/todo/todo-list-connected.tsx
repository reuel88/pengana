import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import type { TodoActions, WebOrgTodo, WebTodo } from "@pengana/todo-client";
import { useTodoListWiring } from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { storeFileInIndexedDB } from "@/features/sync/entities/upload-queue";
import { appDb } from "@/shared/db";

export function TodoListConnected({
	todos,
	triggerSync,
	enqueueUpload,
	actions,
}: {
	todos: (WebTodo | WebOrgTodo)[];
	triggerSync: () => void;
	enqueueUpload: (todoId: string, fileUri: string, mimeType: string) => void;
	actions?: TodoActions;
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

	const { handleToggle, handleDelete, handleResolve, handleFileSelected } =
		useTodoListWiring({
			triggerSync,
			enqueueUpload,
			onError: handleToastError,
			clearError: () => {}, // no-op: errors are sent to toast, not local state
			fileStorage,
			t,
			actions,
			db: appDb,
		});

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFileSelected={handleFileSelected}
			onValidationError={handleToastError}
		/>
	);
}
