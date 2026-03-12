import { useTranslation } from "@pengana/i18n";
import type { TodoActions, WebOrgTodo } from "@pengana/todo-client";
import {
	attachOrgFile,
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
	useTodoListWiring,
} from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { storeFileInMemory } from "@/features/sync/entities/upload-queue";
import { useOrgSync } from "@/features/sync/org-sync-context";

const orgActions: TodoActions = {
	toggleTodo: toggleOrgTodo,
	deleteTodo: deleteOrgTodo,
	resolveConflict: resolveOrgConflict,
	attachFile: attachOrgFile,
};

export function OrgTodoList({ todos }: { todos: WebOrgTodo[] }) {
	const { triggerSync, enqueueUpload } = useOrgSync();
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
			actions: orgActions,
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
