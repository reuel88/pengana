export {
	addTodo,
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "@pengana/todo-client";

import { todoDb } from "@/entities/todo";

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await todoDb.todos.update(id, {
		title,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	});
}
