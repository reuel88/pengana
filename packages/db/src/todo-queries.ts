import { and, eq, gte, inArray } from "drizzle-orm";

import { db } from "./index";
import { todo } from "./schema/todo";

export type ScopeType = "personal" | "org";

export interface TodoRow {
	id: string;
	title: string;
	completed: boolean;
	deleted: boolean;
	updatedAt: Date;
	scopeType: ScopeType;
	scopeId: string;
	userId: string;
	organizationId: string | null;
	createdBy: string | null;
}

export async function findTodoById(id: string): Promise<TodoRow | undefined> {
	const rows = await db.select().from(todo).where(eq(todo.id, id));
	return rows[0];
}

export async function findTodosByIds(
	ids: string[],
): Promise<Map<string, TodoRow>> {
	if (ids.length === 0) return new Map();
	const rows = await db.select().from(todo).where(inArray(todo.id, ids));
	return new Map(rows.map((r) => [r.id, r]));
}

export async function insertTodo(values: {
	id: string;
	title: string;
	completed: boolean;
	deleted: boolean;
	updatedAt: Date;
	scopeType: ScopeType;
	scopeId: string;
	userId: string;
	organizationId?: string | null;
	createdBy?: string | null;
}): Promise<void> {
	await db.insert(todo).values(values);
}

export async function updateTodo(
	id: string,
	values: Partial<{
		title: string;
		completed: boolean;
		deleted: boolean;
		updatedAt: Date;
	}>,
): Promise<void> {
	await db.update(todo).set(values).where(eq(todo.id, id));
}

export async function updateTodoForScope(
	id: string,
	scopeType: ScopeType,
	scopeId: string,
	values: Partial<{
		title: string;
		completed: boolean;
		deleted: boolean;
		updatedAt: Date;
	}>,
): Promise<void> {
	await db
		.update(todo)
		.set(values)
		.where(
			and(
				eq(todo.id, id),
				eq(todo.scopeType, scopeType),
				eq(todo.scopeId, scopeId),
			),
		);
}

export async function getTodosUpdatedSince(
	scopeType: ScopeType,
	scopeId: string,
	since: Date,
	organizationId?: string,
): Promise<TodoRow[]> {
	const conditions = [
		eq(todo.scopeType, scopeType),
		eq(todo.scopeId, scopeId),
		gte(todo.updatedAt, since),
	];
	if (organizationId) {
		conditions.push(eq(todo.organizationId, organizationId));
	}
	return db
		.select()
		.from(todo)
		.where(and(...conditions));
}
