import { count, eq } from "drizzle-orm";

import type {
	BaseSQLiteDatabase,
	SQLiteColumn,
	SQLiteTable,
} from "drizzle-orm/sqlite-core";

type DrizzleDb = BaseSQLiteDatabase<"sync" | "async", unknown>;

type MediaTable = SQLiteTable & {
	id: SQLiteColumn;
	entityId: SQLiteColumn;
	entityType: SQLiteColumn;
	userId: SQLiteColumn;
	url: SQLiteColumn;
	localUri: SQLiteColumn;
	status: SQLiteColumn;
	mimeType: SQLiteColumn;
	position: SQLiteColumn;
	createdAt: SQLiteColumn;
};

export async function addMedia(
	db: DrizzleDb,
	table: MediaTable,
	generateId: () => string,
	entityId: string,
	entityType: string,
	userId: string,
	localUri: string,
	mimeType: string,
): Promise<string> {
	const id = generateId();
	const [row] = await db
		.select({ value: count() })
		.from(table)
		.where(eq(table.entityId, entityId));
	const position = row?.value ?? 0;

	await db.insert(table).values({
		id,
		entityId,
		entityType,
		userId,
		url: null,
		localUri,
		status: "queued",
		mimeType,
		position,
		createdAt: new Date().toISOString(),
	});

	return id;
}

export async function removeMedia(
	db: DrizzleDb,
	table: MediaTable,
	mediaId: string,
): Promise<void> {
	await db.delete(table).where(eq(table.id, mediaId));
}

export async function updateMediaUploaded(
	db: DrizzleDb,
	table: MediaTable,
	mediaId: string,
	url: string,
): Promise<void> {
	await db
		.update(table)
		.set({ url, status: "uploaded" })
		.where(eq(table.id, mediaId));
}

export async function markMediaFailed(
	db: DrizzleDb,
	table: MediaTable,
	mediaId: string,
): Promise<void> {
	await db.update(table).set({ status: "failed" }).where(eq(table.id, mediaId));
}

export async function updateMediaLocalUri(
	db: DrizzleDb,
	table: MediaTable,
	mediaId: string,
	localUri: string,
): Promise<void> {
	await db.update(table).set({ localUri }).where(eq(table.id, mediaId));
}

export async function retryMedia(
	db: DrizzleDb,
	table: MediaTable,
	mediaId: string,
) {
	await db.update(table).set({ status: "queued" }).where(eq(table.id, mediaId));

	const [record] = await db.select().from(table).where(eq(table.id, mediaId));
	return record ?? null;
}

export async function getMediaCountForEntity(
	db: DrizzleDb,
	table: MediaTable,
	entityId: string,
): Promise<number> {
	const [row] = await db
		.select({ value: count() })
		.from(table)
		.where(eq(table.entityId, entityId));
	return row?.value ?? 0;
}
