import type { Media, MediaAttachment } from "@pengana/sync/core";
import type { EnqueueUploadParams } from "@pengana/sync/upload";
import type { EntityDatabase } from "../../dexie";
import type { MediaActions } from "../hooks/media-actions";
import type { AddMediaOptions, LocalMedia, LocalMediaAttachment } from "./db";
import { buildReconcilePlan } from "./reconcile-plan";

export async function addMedia(
	db: EntityDatabase,
	options: AddMediaOptions & { id?: string },
): Promise<string> {
	const id = options.id ?? crypto.randomUUID();
	const table = db.getTable<LocalMedia>("media");

	await table.put({
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
		hlcTimestamp: "",
		fieldClocks: "{}",
		syncStatus: "synced",
		deleted: false,
	});

	return id;
}

export async function attachMediaToEntity(params: {
	db: EntityDatabase;
	mediaId: string;
	entityType: string;
	entityId: string;
}): Promise<string> {
	const { db, mediaId, entityType, entityId } = params;
	const table = db.getTable<LocalMediaAttachment>("mediaAttachments");
	const existing = await table.where({ entityType, entityId }).toArray();
	const position =
		existing.length > 0 ? Math.max(...existing.map((e) => e.position)) + 1 : 0;

	const id = crypto.randomUUID();
	await table.put({
		id,
		mediaId,
		entityType,
		entityId,
		position,
		createdAt: new Date().toISOString(),
	});

	return id;
}

export async function detachMediaFromEntity(params: {
	db: EntityDatabase;
	mediaId: string;
	entityType: string;
	entityId: string;
}): Promise<void> {
	const { db, mediaId, entityType, entityId } = params;
	const table = db.getTable<LocalMediaAttachment>("mediaAttachments");
	const records = await table
		.where({ mediaId })
		.filter((r) => r.entityType === entityType && r.entityId === entityId)
		.toArray();
	if (records.length > 0) {
		await table.bulkDelete(records.map((r) => r.id));
	}
}

export async function removeMedia(
	db: EntityDatabase,
	mediaId: string,
): Promise<void> {
	await db.getTable<LocalMedia>("media").delete(mediaId);
	// Also remove all attachment records for this media
	const attTable = db.getTable<LocalMediaAttachment>("mediaAttachments");
	const attachments = await attTable.where({ mediaId }).toArray();
	if (attachments.length > 0) {
		await attTable.bulkDelete(attachments.map((a) => a.id));
	}
}

export async function updateMediaUploaded(
	db: EntityDatabase,
	mediaId: string,
	url: string,
): Promise<void> {
	await db.getTable<LocalMedia>("media").update(mediaId, {
		url,
		status: "uploaded",
	} as never);
}

export async function updateMediaLocalUri(
	db: EntityDatabase,
	mediaId: string,
	localUri: string,
): Promise<void> {
	await db.getTable<LocalMedia>("media").update(mediaId, { localUri } as never);
}

export async function markMediaFailed(
	db: EntityDatabase,
	mediaId: string,
): Promise<void> {
	await db.getTable<LocalMedia>("media").update(mediaId, {
		status: "failed",
	} as never);
}

export async function getAttachmentForMedia(
	db: EntityDatabase,
	mediaId: string,
): Promise<LocalMediaAttachment | undefined> {
	const attachments = await db
		.getTable<LocalMediaAttachment>("mediaAttachments")
		.where({ mediaId })
		.sortBy("position");
	return attachments[0];
}

export async function retryMedia(
	db: EntityDatabase,
	mediaId: string,
): Promise<LocalMedia | null> {
	await db.getTable<LocalMedia>("media").update(mediaId, {
		status: "queued",
	} as never);

	const record = await db.getTable<LocalMedia>("media").get(mediaId);
	return record ?? null;
}

export async function getMediaCountForEntity(
	db: EntityDatabase,
	entityId: string,
): Promise<number> {
	return db
		.getTable<LocalMediaAttachment>("mediaAttachments")
		.where({ entityId })
		.count();
}

export interface ProcessMediaFileParams {
	db: EntityDatabase;
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
}

export interface ProcessMediaFileResult {
	mediaId: string;
	fileRef: { uri: string; revoke?: () => void };
	enqueueParams: EnqueueUploadParams;
}

export async function processMediaFile(
	params: ProcessMediaFileParams,
): Promise<ProcessMediaFileResult> {
	const {
		db,
		file,
		userId,
		scopeType,
		scopeId,
		organizationId,
		target,
		storeFile,
		createFileRef,
	} = params;

	const mediaId = crypto.randomUUID();

	// Persist file before inserting DB records so a storage failure
	// (e.g. quota exceeded) does not leave orphaned media rows.
	await storeFile(mediaId, file);
	const fileRef = createFileRef(mediaId, file);

	await addMedia(db, {
		id: mediaId,
		userId,
		localUri: fileRef.uri,
		mimeType: file.type,
		scopeType,
		scopeId,
		organizationId,
		createdBy: userId,
	});

	if (target) {
		await attachMediaToEntity({
			db,
			mediaId,
			entityType: target.entityType,
			entityId: target.entityId,
		});
	}

	return {
		mediaId,
		fileRef,
		enqueueParams: {
			fileUri: fileRef.uri,
			mimeType: file.type,
			mediaId,
			entityType: target?.entityType,
			entityId: target?.entityId,
			scopeType: target ? undefined : scopeType,
		},
	};
}

export function createDexieMediaActions(db: EntityDatabase): MediaActions {
	return {
		processMediaFile: (params) => processMediaFile({ db, ...params }),
		removeMedia: (mediaId) => removeMedia(db, mediaId),
		retryMedia: (mediaId) => retryMedia(db, mediaId),
		getAttachmentForMedia: (mediaId) => getAttachmentForMedia(db, mediaId),
	};
}

export interface ReconcileMediaOptions {
	db: EntityDatabase;
	serverMedia: Media[];
	serverAttachments: MediaAttachment[];
	entityIds?: string[];
	scopeWideOpts?: { scopeType: "personal" | "org"; scopeId: string };
}

export async function reconcileMedia(
	options: ReconcileMediaOptions,
): Promise<void> {
	const { db, serverMedia, serverAttachments, entityIds, scopeWideOpts } =
		options;
	const mediaTable = db.getTable<LocalMedia>("media");
	const attTable = db.getTable<LocalMediaAttachment>("mediaAttachments");

	// --- Query local state ---
	const serverIds = serverMedia.map((m) => m.id);
	const existingRecords =
		serverIds.length > 0 ? await mediaTable.bulkGet(serverIds) : [];
	const existingMediaById = new Map<
		string,
		{ id: string; url: string | null }
	>();
	for (let i = 0; i < serverIds.length; i++) {
		const id = serverIds[i];
		const rec = existingRecords[i];
		if (id && rec) existingMediaById.set(id, rec);
	}

	const existingAttachmentsByEntityId = new Map<
		string,
		{ id: string; mediaId: string }[]
	>();
	const existingAttachmentIds = new Set<string>();

	if (entityIds && entityIds.length > 0) {
		const localAtts = await attTable
			.where("entityId")
			.anyOf(entityIds)
			.toArray();
		for (const att of localAtts) {
			existingAttachmentIds.add(att.id);
			const list = existingAttachmentsByEntityId.get(att.entityId) ?? [];
			list.push({ id: att.id, mediaId: att.mediaId });
			existingAttachmentsByEntityId.set(att.entityId, list);
		}
	}

	// For attachment inserts, also check existing attachments by server IDs
	const serverAttIds = serverAttachments.map((a) => a.id);
	if (serverAttIds.length > 0) {
		const existingAtts = await attTable
			.where("id")
			.anyOf(serverAttIds)
			.toArray();
		for (const att of existingAtts) {
			existingAttachmentIds.add(att.id);
		}
	}

	let uploadedMediaNotOnServer: { id: string; attachmentCount: number }[] = [];
	const isScopeWide = !!scopeWideOpts;

	if (isScopeWide) {
		// Scope-wide sync: find all uploaded media in the scope not present on server
		const serverMediaIds = new Set(serverMedia.map((m) => m.id));
		const localUploaded = await mediaTable
			.where("status")
			.equals("uploaded")
			.toArray();
		const candidates = localUploaded.filter(
			(m) =>
				m.scopeType === scopeWideOpts.scopeType &&
				m.scopeId === scopeWideOpts.scopeId &&
				!serverMediaIds.has(m.id),
		);
		uploadedMediaNotOnServer = candidates.map((m) => ({
			id: m.id,
			attachmentCount: 0,
		}));
	} else if (entityIds && entityIds.length > 0) {
		const serverMediaIds = new Set(serverMedia.map((m) => m.id));

		// Get media IDs scoped to the synced entities
		const scopedAtts = await attTable
			.where("entityId")
			.anyOf(entityIds)
			.toArray();
		const scopedMediaIds = new Set(scopedAtts.map((a) => a.mediaId));

		const localUploaded = await mediaTable
			.where("status")
			.equals("uploaded")
			.toArray();
		const candidates = localUploaded.filter(
			(m) => scopedMediaIds.has(m.id) && !serverMediaIds.has(m.id),
		);
		uploadedMediaNotOnServer = await Promise.all(
			candidates.map(async (m) => ({
				id: m.id,
				attachmentCount: await attTable.where({ mediaId: m.id }).count(),
			})),
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
		scopeWide: isScopeWide,
	});

	// --- Execute plan ---
	if (plan.mediaToInsert.length > 0) {
		await mediaTable.bulkPut(plan.mediaToInsert);
	}
	for (const update of plan.mediaToUpdate) {
		await mediaTable.update(update.id, {
			url: update.url,
			status: "uploaded",
		} as never);
	}
	if (plan.attachmentsToInsert.length > 0) {
		await attTable.bulkPut(plan.attachmentsToInsert);
	}
	if (plan.attachmentIdsToDelete.length > 0) {
		await attTable.bulkDelete(plan.attachmentIdsToDelete);
	}
	for (const mId of plan.mediaIdsToDelete) {
		await mediaTable.delete(mId);
	}
}
