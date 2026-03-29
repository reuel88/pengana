import { HLC, serializeHlc } from "@pengana/sync/core";
import type { EntityDatabase } from "../dexie";
import {
	dexieAdd,
	dexieResolveConflict,
	dexieSoftDelete,
	dexieUpdate,
} from "../dexie";
import type { LocalTodo } from "./db";
import type { TodoActions } from "./use-todo-handlers";

export interface DexieTodoScope {
	userId: string;
	scopeId: string;
	organizationId: string;
	scopeType: "personal" | "org";
}

export interface TodoActionDeps {
	db: EntityDatabase;
	scope: DexieTodoScope;
	hlc: HLC;
}

// ---------------------------------------------------------------------------
// 2do CRUD
// ---------------------------------------------------------------------------

export interface AddTodoParams {
	db: EntityDatabase;
	title: string;
	userId: string;
	scopeId: string;
	organizationId: string;
	scopeType: "personal" | "org";
	hlc: HLC;
}

export async function addTodo(params: AddTodoParams): Promise<void> {
	const { db, title, userId, scopeId, organizationId, scopeType, hlc } = params;

	const todoId = crypto.randomUUID();

	const ts = serializeHlc(hlc.now());

	await dexieAdd<LocalTodo>(db, "todos", {
		id: todoId,

		title,
		completed: false,

		userId,
		scopeId,
		organizationId,
		scopeType,

		updatedAt: new Date().toISOString(),
		createdBy: userId,
		hlcTimestamp: ts,
		fieldClocks: { title: ts, completed: ts, deleted: ts },

		syncStatus: "pending",
		deleted: false,
	});
}

export interface ToggleTodoParams {
	db: EntityDatabase;
	id: string;
	hlc: HLC;
}

export async function toggleTodo(params: ToggleTodoParams): Promise<void> {
	const { db, id, hlc } = params;

	const todo = await db.getTable<LocalTodo>("todos").get(id);
	if (!todo) throw new Error(`Todo not found: ${id}`);

	await dexieUpdate<LocalTodo>(
		db,
		{ tableName: "todos", id, hlcNow: () => hlc.now() },
		{ completed: !todo.completed },
	);
}

export interface DeleteTodoParams {
	db: EntityDatabase;
	id: string;
	hlc: HLC;
}

export async function deleteTodo(params: DeleteTodoParams): Promise<void> {
	const { db, id, hlc } = params;

	await dexieSoftDelete<LocalTodo>(db, {
		tableName: "todos",
		id,
		hlcNow: () => hlc.now(),
	});
}

export interface ResolveConflictTodoParams {
	db: EntityDatabase;
	id: string;
	hlc: HLC;
	resolution: "local" | "server";
}
export async function resolveConflictTodo(
	params: ResolveConflictTodoParams,
): Promise<void> {
	const { db, id, hlc, resolution } = params;

	await dexieResolveConflict<LocalTodo>(db, {
		tableName: "todos",
		id,
		hlcNow: () => hlc.now(),
		resolution,
	});
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDexieTodoActions(db: EntityDatabase): TodoActions {
	const hlc = new HLC(crypto.randomUUID());
	return {
		addTodo: (params) => addTodo({ db, hlc, ...params }),
		toggleTodo: (id) =>
			toggleTodo({
				db,
				id,
				hlc,
			}),
		deleteTodo: (id) =>
			deleteTodo({
				db,
				id,
				hlc,
			}),
		resolveConflict: (id, resolution) =>
			resolveConflictTodo({
				db,
				id,
				hlc,
				resolution,
			}),
	};
}
