import { useSync } from "@/features/sync/sync-context";

import { addTodo } from "./todo-actions";
import { TodoInputBase } from "./todo-input-base";

export function TodoInput({ userId }: { userId: string }) {
	const { triggerSync } = useSync();

	return (
		<TodoInputBase
			onAdd={(title) => addTodo(userId, title)}
			triggerSync={triggerSync}
		/>
	);
}
