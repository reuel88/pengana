import { defineEntity } from "@pengana/entity-store";

export const todoEntity = defineEntity({
	name: "todos",
	indexes: "id, userId, syncStatus, updatedAt",
	scoping: "personal",
});

export const orgTodoEntity = defineEntity({
	name: "orgTodos",
	indexes: "id, userId, syncStatus, updatedAt",
	scoping: "org",
});
