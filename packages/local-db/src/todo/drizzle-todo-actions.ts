import { HLC, serializeHlc } from "@pengana/sync/core";
import { eq } from "drizzle-orm";
import type { BaseSQLiteDatabase, SQLiteColumn } from "drizzle-orm/sqlite-core";
import { createDrizzleActions } from "../drizzle";
import type { TodoActions } from "./use-todo-handlers";

export function createDrizzleTodoActions(params: {
	db: BaseSQLiteDatabase<"sync" | "async", unknown>;
	// biome-ignore lint/suspicious/noExplicitAny: Must accept any Drizzle table shape
	todosTable: any;
	idColumn: SQLiteColumn;
	generateId: () => string;
}): TodoActions {
	const { db, todosTable, idColumn, generateId } = params;
	const hlc = new HLC(generateId());
	const actions = createDrizzleActions<Record<string, unknown>>(
		db,
		todosTable,
		idColumn,
		{ hlcNow: () => hlc.now() },
	);

	return {
		async addTodo(addParams): Promise<void> {
			const { title, userId, scopeId, organizationId, scopeType } = addParams;
			const ts = serializeHlc(hlc.now());
			await actions.add({
				id: generateId(),
				title,
				completed: false,
				updatedAt: new Date().toISOString(),
				hlcTimestamp: ts,
				fieldClocks: JSON.stringify({ title: ts, completed: ts, deleted: ts }),
				userId,
				scopeId,
				organizationId,
				createdBy: userId,
				scopeType,
				syncStatus: "pending",
				deleted: false,
			});
		},

		async toggleTodo(id: string): Promise<void> {
			const [todo] = await db.select().from(todosTable).where(eq(idColumn, id));
			if (!todo) throw new Error(`Todo not found: ${id}`);
			await actions.update(id, {
				completed: !(todo as { completed: boolean }).completed,
			});
		},

		async deleteTodo(id: string): Promise<void> {
			await actions.softDelete(id);
		},

		async resolveConflict(
			id: string,
			resolution: "local" | "server",
		): Promise<void> {
			await actions.resolveConflict(id, resolution);
		},
	};
}
