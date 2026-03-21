import type { Media, MediaAttachment } from "@pengana/sync-engine";
import type { EnqueueUploadParams } from "@pengana/upload-queue";
import { and, count, eq, inArray, max, notInArray } from "drizzle-orm";

import type {
	BaseSQLiteDatabase,
	SQLiteColumn,
	SQLiteTable,
} from "drizzle-orm/sqlite-core";

import type { MediaActions } from "../hooks/media-actions";
import type { AddMediaOptions } from "./db";
import { buildReconcilePlan } from "./reconcile-plan";

export type DrizzleDb = BaseSQLiteDatabase<"sync" | "async", unknown>;

export type MediaTable = SQLiteTable & {
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

export type MediaAttachmentTable = SQLiteTable & {
	id: SQLiteColumn;
	mediaId: SQLiteColumn;
	entityType: SQLiteColumn;
	entityId: SQLiteColumn;
	position: SQLiteColumn;
	createdAt: SQLiteColumn;
};

export async function addMedia(params: {
	db: DrizzleDb;
	table: MediaTable;
	generateId: () => string;
	options: AddMediaOptions;
}): Promise<string> {
	const { db, table, generateId, options } = params;
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

export async function attachMediaToEntity(params: {
	db: DrizzleDb;
	table: MediaAttachmentTable;
	generateId: () => string;
	mediaId: string;
	entityType: string;
	entityId: string;
}): Promise<string> {
	const { db, table, generateId, mediaId, entityType, entityId } = params;
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

export async function updateMediaUploaded(params: {
	db: DrizzleDb;
	table: MediaTable;
	mediaId: string;
	url: string;
}): Promise<void> {
	const { db, table, mediaId, url } = params;
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

export async function updateMediaLocalUri(params: {
	db: DrizzleDb;
	table: MediaTable;
	mediaId: string;
	localUri: string;
}): Promise<void> {
	const { db, table, mediaId, localUri } = params;
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

export async function detachMediaFromEntity(params: {
	db: DrizzleDb;
	table: MediaAttachmentTable;
	mediaId: string;
	entityType: string;
	entityId: string;
}): Promise<void> {
	const { db, table, mediaId, entityType, entityId } = params;
	await db
		.delete(table)
		.where(
			and(
				eq(table.mediaId, mediaId),
				eq(table.entityType, entityType),
				eq(table.entityId, entityId),
			),
		);
}

export async function getAttachmentForMedia(
	db: DrizzleDb,
	table: MediaAttachmentTable,
	mediaId: string,
) {
	const [row] = await db
		.select()
		.from(table)
		.where(eq(table.mediaId, mediaId))
		.limit(1);
	return row ?? null;
}

export interface DrizzleProcessMediaFileParams {
	db: DrizzleDb;
	mediaTable: MediaTable;
	mediaAttachmentTable: MediaAttachmentTable;
	generateId: () => string;
	file: File;
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	target?: { entityType: string; entityId: string };
	storeFile: (id: string, file: File) => Promise<void> | void;
	createFileRef: (
		id: string,
		file: File,
	) => { uri: string; revoke?: () => void };
	enqueueUpload: (params: EnqueueUploadParams) => void;
}

export interface DrizzleProcessMediaFileResult {
	mediaId: string;
	fileRef: { uri: string; revoke?: () => void };
}

export async function processMediaFile(
	params: DrizzleProcessMediaFileParams,
): Promise<DrizzleProcessMediaFileResult> {
	const {
		db,
		mediaTable,
		mediaAttachmentTable,
		generateId,
		file,
		userId,
		scopeType,
		scopeId,
		organizationId,
		target,
		storeFile,
		createFileRef,
		enqueueUpload,
	} = params;

	const mediaId = generateId();

	// Persist file before inserting DB records so a storage failure
	// (e.g. quota exceeded) does not leave orphaned media rows.
	await storeFile(mediaId, file);
	const fileRef = createFileRef(mediaId, file);

	await addMedia({
		db,
		table: mediaTable,
		generateId: () => mediaId,
		options: {
			userId,
			localUri: fileRef.uri,
			mimeType: file.type,
			scopeType,
			scopeId,
			organizationId,
			createdBy: userId,
		},
	});

	if (target) {
		await attachMediaToEntity({
			db,
			table: mediaAttachmentTable,
			generateId,
			mediaId,
			entityType: target.entityType,
			entityId: target.entityId,
		});
	}

	enqueueUpload({
		fileUri: fileRef.uri,
		mimeType: file.type,
		mediaId,
		entityType: target?.entityType,
		entityId: target?.entityId,
		scopeType: target ? undefined : scopeType,
	});

	return { mediaId, fileRef };
}

export function createDrizzleMediaActions(params: {
	db: DrizzleDb;
	mediaTable: MediaTable;
	mediaAttachmentTable: MediaAttachmentTable;
	generateId: () => string;
}): MediaActions {
	const { db, mediaTable, mediaAttachmentTable, generateId } = params;
	return {
		processMediaFile: (params) =>
			processMediaFile({
				db,
				mediaTable,
				mediaAttachmentTable,
				generateId,
				...params,
			}),
		removeMedia: async (mediaId) => {
			await removeMedia(db, mediaTable, mediaId);
			await removeMediaAttachments(db, mediaAttachmentTable, mediaId);
		},
		retryMedia: (mediaId) =>
			retryMedia(db, mediaTable, mediaId) as Promise<{
				id: string;
				localUri: string | null;
				mimeType: string;
				scopeType?: string;
			} | null>,
		getAttachmentForMedia: async (mediaId) => {
			const row = await getAttachmentForMedia(
				db,
				mediaAttachmentTable,
				mediaId,
			);
			return row
				? {
						entityType: row.entityType as string,
						entityId: row.entityId as string,
					}
				: undefined;
		},
	};
}

export interface ReconcileDrizzleMediaOptions {
	db: DrizzleDb;
	mediaTable: MediaTable;
	mediaAttachmentTable: MediaAttachmentTable;
	serverMedia: Media[];
	serverAttachments: MediaAttachment[];
	entityIds?: string[];
}

export async function reconcileMedia(
	options: ReconcileDrizzleMediaOptions,
): Promise<void> {
	const {
		db,
		mediaTable,
		mediaAttachmentTable,
		serverMedia,
		serverAttachments,
		entityIds,
	} = options;
	await db.transaction(async (tx) => {
		// --- Query local state ---
		const serverIds = serverMedia.map((m) => m.id);
		const existingRows =
			serverIds.length > 0
				? await tx
						.select()
						.from(mediaTable)
						.where(inArray(mediaTable.id, serverIds))
				: [];
		const existingMediaById = new Map(
			existingRows.map((r) => [r.id, { id: r.id, url: r.url }]),
		);

		const existingAttachmentsByEntityId = new Map<
			string,
			{ id: string; mediaId: string }[]
		>();
		const existingAttachmentIds = new Set<string>();

		if (entityIds && entityIds.length > 0) {
			for (const entityId of entityIds) {
				const localAtts = await tx
					.select()
					.from(mediaAttachmentTable)
					.where(eq(mediaAttachmentTable.entityId, entityId));
				const mapped = localAtts.map((a) => ({
					id: a.id,
					mediaId: a.mediaId,
				}));
				existingAttachmentsByEntityId.set(entityId, mapped);
				for (const att of localAtts) {
					existingAttachmentIds.add(att.id);
				}
			}
		}

		const serverAttIds = serverAttachments.map((a) => a.id);
		if (serverAttIds.length > 0) {
			const existingAtts = await tx
				.select()
				.from(mediaAttachmentTable)
				.where(inArray(mediaAttachmentTable.id, serverAttIds));
			for (const att of existingAtts) {
				existingAttachmentIds.add(att.id);
			}
		}

		let uploadedMediaNotOnServer: {
			id: string;
			attachmentCount: number;
		}[] = [];
		if (entityIds && entityIds.length > 0) {
			const serverMediaIds = serverMedia.map((m) => m.id);

			const scopedAtts = await tx
				.select({ mediaId: mediaAttachmentTable.mediaId })
				.from(mediaAttachmentTable)
				.where(inArray(mediaAttachmentTable.entityId, entityIds));
			const scopedMediaIds = [...new Set(scopedAtts.map((a) => a.mediaId))];

			const orphanCandidates =
				scopedMediaIds.length === 0
					? []
					: serverMediaIds.length > 0
						? await tx
								.select({ id: mediaTable.id })
								.from(mediaTable)
								.where(
									and(
										eq(mediaTable.status, "uploaded"),
										inArray(mediaTable.id, scopedMediaIds),
										notInArray(mediaTable.id, serverMediaIds),
									),
								)
						: await tx
								.select({ id: mediaTable.id })
								.from(mediaTable)
								.where(
									and(
										eq(mediaTable.status, "uploaded"),
										inArray(mediaTable.id, scopedMediaIds),
									),
								);

			uploadedMediaNotOnServer = await Promise.all(
				orphanCandidates.map(async (c) => {
					const remaining = await tx
						.select({ id: mediaAttachmentTable.id })
						.from(mediaAttachmentTable)
						.where(eq(mediaAttachmentTable.mediaId, c.id as string))
						.limit(1);
					return { id: c.id as string, attachmentCount: remaining.length };
				}),
			);
		}

		// --- Build plan ---
		const plan = buildReconcilePlan({
			serverMedia,
			serverAttachments,
			existingMediaById,
			existingAttachmentsByEntityId,
			existingAttachmentIds,
			uploadedMediaNotOnServer,
			entityIds,
		});

		// --- Execute plan with Drizzle ---
		if (plan.mediaToInsert.length > 0) {
			await tx.insert(mediaTable).values(plan.mediaToInsert);
		}
		for (const update of plan.mediaToUpdate) {
			await tx
				.update(mediaTable)
				.set({ url: update.url, status: "uploaded" })
				.where(eq(mediaTable.id, update.id));
		}
		if (plan.attachmentsToInsert.length > 0) {
			await tx.insert(mediaAttachmentTable).values(plan.attachmentsToInsert);
		}
		if (plan.attachmentIdsToDelete.length > 0) {
			await tx
				.delete(mediaAttachmentTable)
				.where(inArray(mediaAttachmentTable.id, plan.attachmentIdsToDelete));
		}
		for (const mId of plan.mediaIdsToDelete) {
			await tx.delete(mediaTable).where(eq(mediaTable.id, mId));
		}
	});
}
