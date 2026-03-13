import { createWebUploadAdapter as createTodoClientWebUploadAdapter } from "@pengana/todo-client";
import { appDb } from "@/features/todo/entities/todo";

export function createWebUploadAdapter() {
	return createTodoClientWebUploadAdapter(appDb);
}
