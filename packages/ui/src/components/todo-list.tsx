import { useTranslation } from "@pengana/i18n";
import { TodoItem, type TodoItemData } from "./todo-item";

interface TodoListProps {
	todos: TodoItemData[];
	onToggle: (id: string) => void;
	onDelete: (id: string) => void;
	onResolve: (id: string, resolution: "local" | "server") => void;
	onFilesSelected: (id: string, files: File[]) => void;
	onRemoveAttachment?: (id: string, attachmentId: string) => void;
	onRetryAttachment?: (id: string, attachmentId: string) => void;
	onValidationError?: (id: string, message: string) => void;
	errors?: Record<string, string | null>;
}

export function TodoList({
	todos,
	onToggle,
	onDelete,
	onResolve,
	onFilesSelected,
	onRemoveAttachment,
	onRetryAttachment,
	onValidationError,
	errors,
}: TodoListProps) {
	const { t } = useTranslation("todos");

	if (todos.length === 0) {
		return (
			<p className="py-4 text-center text-muted-foreground text-sm">
				{t("empty")}
			</p>
		);
	}

	return (
		<div
			className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground"
			data-slot="card"
			data-testid="todo-list"
		>
			{todos.map((todo) => (
				<TodoItem
					key={todo.id}
					todo={todo}
					onToggle={() => onToggle(todo.id)}
					onDelete={() => onDelete(todo.id)}
					onResolve={(resolution) => onResolve(todo.id, resolution)}
					onFilesSelected={(files) => onFilesSelected(todo.id, files)}
					onRemoveAttachment={(attachmentId) =>
						onRemoveAttachment?.(todo.id, attachmentId)
					}
					onRetryAttachment={
						onRetryAttachment
							? (attachmentId) => onRetryAttachment(todo.id, attachmentId)
							: undefined
					}
					onValidationError={
						onValidationError
							? (msg) => onValidationError(todo.id, msg)
							: undefined
					}
					error={errors?.[todo.id]}
				/>
			))}
		</div>
	);
}
