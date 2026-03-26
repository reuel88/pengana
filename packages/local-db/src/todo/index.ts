export { createTodoSyncAdapter } from "./adapter";
export type { LocalTodo } from "./db";
export type { DexieTodoScope, TodoActionDeps } from "./dexie-todo-actions";
export {
	addTodo,
	createDexieTodoActions,
	deleteTodo,
	resolveConflictTodo,
	toggleTodo,
} from "./dexie-todo-actions";
export { createDrizzleTodoActions } from "./drizzle-todo-actions";
export { filterTodos } from "./filter-todos";
export type { TodoConfig } from "./todo-config";
export { orgTodoConfig, personalTodoConfig } from "./todo-config";
export { todoEntity } from "./todo-entity";
export type { WebTodoWithAttachments } from "./use-todo-dexie";
export { useTodos } from "./use-todo-dexie";
// useTodosDrizzle is NOT re-exported here to avoid pulling expo-sqlite into web bundles.
export type {
	FileStorageStrategy,
	TodoActions,
	TodoHandlerDeps,
	TodoHandlerResult,
} from "./use-todo-handlers";
export { useTodoHandlers } from "./use-todo-handlers";
export { useTodoListWiring } from "./use-todo-list-wiring";
