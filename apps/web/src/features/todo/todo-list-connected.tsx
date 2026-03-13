import { useTranslation } from "@pengana/i18n";
import type { TodoActions, WebOrgTodo, WebTodo } from "@pengana/todo-client";
import { useTodoListWiring } from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { storeFileInMemory } from "@/features/sync/entities/upload-queue";

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

	const onError = useCallback((_id: string, msg: string) => {
		toast.error(msg);
	}, []);

	const onValidationError = useCallback((_id: string, msg: string) => {
		toast.error(msg);
	}, []);

	const fileStorage = useMemo(
		() => ({
			storeFile: (_id: string, file: File) => storeFileInMemory(_id, file),
			createFileRef: (_id: string, file: File) => URL.createObjectURL(file),
		}),
		[],
	);

	const { handleToggle, handleDelete, handleResolve, handleFileSelected } =
		useTodoListWiring({
			triggerSync,
			enqueueUpload,
			onError,
			clearError: () => {}, // no-op: errors are sent to toast, not local state
			fileStorage,
			t,
			actions,
		});

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFileSelected={handleFileSelected}
			onValidationError={onValidationError}
		/>
	);
}
