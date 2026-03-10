import { useTranslation } from "@pengana/i18n";
import type { WebTodo } from "@pengana/todo-client";
import { useTodoListWiring } from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { storeFileInMemory } from "@/entities/upload-queue";
import { useSync } from "@/features/sync/sync-context";

export function TodoList({ todos }: { todos: WebTodo[] }) {
	const { triggerSync, enqueueUpload } = useSync();
	const { t } = useTranslation();

	const onError = useCallback((_id: string, msg: string) => {
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
			clearError: () => {},
			fileStorage,
			t,
		});

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFileSelected={handleFileSelected}
			onValidationError={(_id, msg) => toast.error(msg)}
		/>
	);
}
