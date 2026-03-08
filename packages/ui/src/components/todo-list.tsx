import { useTranslation } from "@pengana/i18n";
import { TodoItem, type TodoItemData } from "./todo-item";

interface TodoListProps {
	todos: TodoItemData[];
	onToggle: (id: string) => void;
	onDelete: (id: string) => void;
	onResolve: (id: string, resolution: "local" | "server") => void;
	onFileSelected: (id: string, file: File) => void;
	onValidationError?: (id: string, message: string) => void;
	errors?: Record<string, string | null>;
}

export function TodoList({
	todos,
	onToggle,
	onDelete,
	onResolve,
	onFileSelected,
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
		<div className="rounded-none border border-border">
			{todos.map((todo) => (
				<TodoItem
					key={todo.id}
					todo={todo}
					onToggle={() => onToggle(todo.id)}
					onDelete={() => onDelete(todo.id)}
					onResolve={(resolution) => onResolve(todo.id, resolution)}
					onFileSelected={(file) => onFileSelected(todo.id, file)}
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
