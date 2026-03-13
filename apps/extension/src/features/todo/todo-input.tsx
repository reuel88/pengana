import { addTodo } from "@pengana/todo-client";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { useSync } from "@/features/sync/sync-context";
import { appDb } from "@/shared/db";

export function TodoInput({ userId }: { userId: string }) {
	const { triggerSync } = useSync();

	return (
		<TodoInputBase
			onSubmit={async (title) => {
				try {
					await addTodo(appDb, userId, title);
					triggerSync();
				} catch (err) {
					console.error("[TodoInput] failed to add todo:", err);
				}
			}}
		/>
	);
}
