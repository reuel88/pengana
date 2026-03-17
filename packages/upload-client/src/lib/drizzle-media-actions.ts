import { count, eq, max } from "drizzle-orm";

import type {
	BaseSQLiteDatabase,
	SQLiteColumn,
	SQLiteTable,
} from "drizzle-orm/sqlite-core";

import type { AddMediaOptions } from "./db";

type DrizzleDb = BaseSQLiteDatabase<"sync" | "async", unknown>;

type MediaTable = SQLiteTable & {
	id: SQLiteColumn;
	userId: SQLiteColumn;
	url: SQLiteColumn;
	localUri: SQLiteColumn;
	status: SQLiteColumn;
	mimeType: SQLiteColumn;
	createdAt: SQLiteColumn;
	updatedAt: SQLiteColumn;
	scopeType: SQLiteColumn;
	scopeId: SQLiteColumn;
	organizationId: SQLiteColumn;
	createdBy: SQLiteColumn;
};

type MediaAttachmentTable = SQLiteTable & {
	id: SQLiteColumn;
	mediaId: SQLiteColumn;
	entityType: SQLiteColumn;
	entityId: SQLiteColumn;
	position: SQLiteColumn;
	createdAt: SQLiteColumn;
};

export async function addMedia(
	db: DrizzleDb,
	table: MediaTable,
	generateId: () => string,
	options: AddMediaOptions,
): Promise<string> {
	const id = generateId();

	await db.insert(table).values({
		id,
		userId: options.userId,
		url: null,
		localUri: options.localUri,
		status: "queued",
		mimeType: options.mimeType,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		scopeType: options.scopeType,
		scopeId: options.scopeId,
		organizationId: options.organizationId,
		createdBy: options.createdBy,
	});

	return id;
}

export async function attachMediaToEntity(
	db: DrizzleDb,
	table: MediaAttachmentTable,
	generateId: () => string,
	mediaId: string,
	entityType: string,
	entityId: string,
): Promise<string> {
	const [row] = await db
		.select({ value: max(table.position) })
		.from(table)
		.where(eq(table.entityId, entityId));
	const position = (Number(row?.value) || 0) + 1;

	const id = generateId();
	await db.insert(table).values({
		id,
		mediaId,
		entityType,
		entityId,
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

export async function removeMediaAttachments(
	db: DrizzleDb,
	table: MediaAttachmentTable,
	mediaId: string,
): Promise<void> {
	await db.delete(table).where(eq(table.mediaId, mediaId));
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
	table: MediaAttachmentTable,
	entityId: string,
): Promise<number> {
	const [row] = await db
		.select({ value: count() })
		.from(table)
		.where(eq(table.entityId, entityId));
	return row?.value ?? 0;
}
