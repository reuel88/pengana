import { and, eq, gte } from "drizzle-orm";

import { db } from "./index";
import { todo } from "./schema/todo";

export interface TodoRow {
	id: string;
	title: string;
	completed: boolean;
	deleted: boolean;
	attachmentUrl: string | null;
	updatedAt: Date;
	userId: string;
}

export async function findTodoById(id: string): Promise<TodoRow | undefined> {
	const rows = await db.select().from(todo).where(eq(todo.id, id));
	return rows[0];
}

export async function insertTodo(values: {
	id: string;
	title: string;
	completed: boolean;
	deleted: boolean;
	attachmentUrl?: string | null;
	updatedAt: Date;
	userId: string;
}): Promise<void> {
	await db.insert(todo).values(values);
}

export async function updateTodo(
	id: string,
	values: Partial<{
		title: string;
		completed: boolean;
		deleted: boolean;
		attachmentUrl: string | null;
		updatedAt: Date;
	}>,
): Promise<void> {
	await db.update(todo).set(values).where(eq(todo.id, id));
}

export async function updateTodoForUser(
	id: string,
	userId: string,
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
		.where(and(eq(todo.id, id), eq(todo.userId, userId)));
}

export async function getTodosUpdatedSince(
	userId: string,
	since: Date,
): Promise<TodoRow[]> {
	return db
		.select()
		.from(todo)
		.where(and(eq(todo.userId, userId), gte(todo.updatedAt, since)));
}
