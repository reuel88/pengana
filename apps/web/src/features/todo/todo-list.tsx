import { useTranslation } from "@pengana/i18n";
import type { WebTodo } from "@pengana/todo-client";
import {
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { toast } from "sonner";
import { storeFileForUpload } from "@/entities/upload-queue";
import { useSync } from "@/features/sync/sync-context";

export function TodoList({ todos }: { todos: WebTodo[] }) {
	const { triggerSync, enqueueUpload } = useSync();
	const { t } = useTranslation();

	const handleToggle = async (id: string) => {
		try {
			await toggleTodo(id);
			triggerSync();
		} catch {
			toast.error(t("errors:failedToToggleTodo"));
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteTodo(id);
			triggerSync();
		} catch {
			toast.error(t("errors:failedToDeleteTodo"));
		}
	};

	const handleResolve = async (id: string, resolution: "local" | "server") => {
		try {
			await resolveConflict(id, resolution);
			triggerSync();
		} catch {
			toast.error(t("errors:failedToResolveConflict"));
		}
	};

	const handleFileSelected = async (id: string, file: File) => {
		try {
			storeFileForUpload(id, file);
			const blobUrl = URL.createObjectURL(file);
			await attachFile(id, blobUrl);
			enqueueUpload(id, blobUrl, file.type);
		} catch {
			toast.error(t("errors:failedToAttachFile"));
		}
	};

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
