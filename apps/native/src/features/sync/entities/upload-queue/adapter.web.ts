import { createWebUploadAdapter as createTodoClientWebUploadAdapter } from "@pengana/todo-client";
import { todoDb } from "@/features/todo/entities/todo";

export function createWebUploadAdapter() {
	return createTodoClientWebUploadAdapter(todoDb);
}
