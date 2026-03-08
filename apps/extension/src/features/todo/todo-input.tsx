import { addTodo } from "@pengana/todo-client";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { useSync } from "@/features/sync/sync-context";

export function TodoInput({ userId }: { userId: string }) {
	const { triggerSync } = useSync();

	return (
		<TodoInputBase
			onSubmit={async (title) => {
				await addTodo(userId, title);
				triggerSync();
			}}
		/>
	);
}
