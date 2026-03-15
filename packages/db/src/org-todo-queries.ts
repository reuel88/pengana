import { and, eq, gte } from "drizzle-orm";

import { db } from "./index";
import { orgTodo } from "./schema/org-todo";

export interface OrgTodoRow {
	id: string;
	title: string;
	completed: boolean;
	deleted: boolean;
	updatedAt: Date;
	organizationId: string;
	createdBy: string | null;
}

export async function findOrgTodoById(
	id: string,
): Promise<OrgTodoRow | undefined> {
	const rows = await db.select().from(orgTodo).where(eq(orgTodo.id, id));
	return rows[0];
}

export async function insertOrgTodo(values: {
	id: string;
	title: string;
	completed: boolean;
	deleted: boolean;
	updatedAt: Date;
	organizationId: string;
	createdBy: string | null;
}): Promise<void> {
	await db.insert(orgTodo).values(values);
}

export async function updateOrgTodo(
	id: string,
	values: Partial<{
		title: string;
		completed: boolean;
		deleted: boolean;
		updatedAt: Date;
	}>,
): Promise<void> {
	await db.update(orgTodo).set(values).where(eq(orgTodo.id, id));
}

export async function updateOrgTodoForOrg(
	id: string,
	organizationId: string,
	values: Partial<{
		title: string;
		completed: boolean;
		deleted: boolean;
		updatedAt: Date;
	}>,
): Promise<void> {
	await db
		.update(orgTodo)
		.set(values)
		.where(and(eq(orgTodo.id, id), eq(orgTodo.organizationId, organizationId)));
}

export async function getOrgTodosUpdatedSince(
	organizationId: string,
	since: Date,
): Promise<OrgTodoRow[]> {
	return db
		.select()
		.from(orgTodo)
		.where(
			and(
				eq(orgTodo.organizationId, organizationId),
				gte(orgTodo.updatedAt, since),
			),
		);
}
