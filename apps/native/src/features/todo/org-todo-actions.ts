import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { appDb, todos } from "@/features/todo/entities/todo";
import { pendingUpdate } from "./lib/pending-update";

export async function addOrgTodo(
	organizationId: string,
	userId: string,
	title: string,
): Promise<void> {
	await appDb.insert(todos).values({
		id: randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: organizationId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		attachmentUrl: null,
		attachmentLocalUri: null,
		attachmentStatus: null,
	});
}

export async function toggleOrgTodo(id: string): Promise<void> {
	const [todo] = await appDb.select().from(todos).where(eq(todos.id, id));
	if (!todo) throw new Error(`Org todo not found: ${id}`);

	await pendingUpdate(id, { completed: !todo.completed });
}

export async function deleteOrgTodo(id: string): Promise<void> {
	await pendingUpdate(id, { deleted: true });
}

export async function resolveOrgConflict(
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	if (resolution === "local") {
		await pendingUpdate(id, {});
	} else {
		await appDb
			.update(todos)
			.set({ syncStatus: "synced" })
			.where(eq(todos.id, id));
	}
}

export async function attachOrgFile(
	todoId: string,
	localUri: string,
): Promise<void> {
	await appDb
		.update(todos)
		.set({
			attachmentLocalUri: localUri,
			attachmentStatus: "queued",
		})
		.where(eq(todos.id, todoId));
}
