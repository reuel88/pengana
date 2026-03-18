import type { EntityDatabase } from "@pengana/entity-store";
import {
	isAllowedMimeType,
	isQuotaError,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync-engine";
import { useCallback, useMemo } from "react";
import type { LocalMediaAttachment } from "../lib/db";
import {
	addMedia,
	attachMediaToEntity,
	removeMedia,
	retryMedia,
	updateMediaLocalUri,
} from "../lib/media-actions";
import type { MediaConfig } from "../lib/media-config";

export interface MediaFileStorageStrategy {
	storeFile: (id: string, file: File) => Promise<void> | void;
	createFileRef: (
		id: string,
		file: File,
	) => { uri: string; revoke?: () => void };
}

export interface MediaAttachmentTarget {
	entityType: string;
	entityId: string;
}

export interface MediaHandlerDeps {
	db: EntityDatabase;
	triggerSync: () => void;
	enqueueUpload: (
		fileUri: string,
		mimeType: string,
		mediaId: string,
		entityType?: string,
		entityId?: string,
		scopeType?: "personal" | "org",
	) => void;
	userId: string;
	scopeId: string;
	organizationId: string | null;
	config: MediaConfig;
	fileStorage: MediaFileStorageStrategy;
	t: (key: string) => string;
	deleteMedia?: (mediaId: string) => Promise<unknown>;
	onError?: (id: string | null, message: string) => void;
	onDeleteSuccess?: (mediaId: string) => void;
	onUploadEnqueued?: () => void;
}

async function getAttachmentForMedia(
	db: EntityDatabase,
	mediaId: string,
): Promise<LocalMediaAttachment | undefined> {
	const attachments = await db
		.getTable<LocalMediaAttachment>("mediaAttachments")
		.where({ mediaId })
		.sortBy("position");
	return attachments[0];
}

export function useMediaHandlers(deps: MediaHandlerDeps) {
	const {
		db,
		triggerSync,
		enqueueUpload,
		userId,
		scopeId,
		organizationId,
		config,
		fileStorage: { storeFile, createFileRef },
		t,
		deleteMedia: deleteMediaOnServer,
		onError,
		onDeleteSuccess,
		onUploadEnqueued,
	} = deps;

	const handleFilesSelected = useCallback(
		async (files: File[], target?: MediaAttachmentTarget) => {
			if (!db) return;
			const refs: Array<{ revoke?: () => void }> = [];

			try {
				for (const file of files) {
					if (!isAllowedMimeType(file.type)) {
						onError?.(null, t("dropzone.rejected.type"));
						continue;
					}

					if (file.size > MAX_FILE_SIZE_BYTES) {
						onError?.(null, t("dropzone.rejected.size"));
						continue;
					}

					const mediaId = await addMedia(db, {
						userId,
						localUri: "",
						mimeType: file.type,
						scopeType: config.scopeType,
						scopeId,
						organizationId,
						createdBy: userId,
					});

					if (target) {
						await attachMediaToEntity(
							db,
							mediaId,
							target.entityType,
							target.entityId,
						);
					}

					await storeFile(mediaId, file);
					const fileRef = createFileRef(mediaId, file);
					refs.push(fileRef);

					await updateMediaLocalUri(db, mediaId, fileRef.uri);

					enqueueUpload(
						fileRef.uri,
						file.type,
						mediaId,
						target?.entityType,
						target?.entityId,
						target ? undefined : config.scopeType,
					);
				}

				triggerSync();
				onUploadEnqueued?.();
			} catch (error) {
				for (const ref of refs) ref.revoke?.();
				onError?.(
					null,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
			}
		},
		[
			config.scopeType,
			createFileRef,
			db,
			enqueueUpload,
			onError,
			onUploadEnqueued,
			organizationId,
			scopeId,
			storeFile,
			t,
			triggerSync,
			userId,
		],
	);

	const handleDelete = useCallback(
		async (mediaId: string) => {
			try {
				await deleteMediaOnServer?.(mediaId);
				await removeMedia(db, mediaId);
				onDeleteSuccess?.(mediaId);
				triggerSync();
			} catch (error) {
				onError?.(
					mediaId,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
			}
		},
		[db, deleteMediaOnServer, onDeleteSuccess, onError, t, triggerSync],
	);

	const handleRetry = useCallback(
		async (mediaId: string) => {
			try {
				const record = await retryMedia(db, mediaId);
				if (!record?.localUri) return;
				const attachment = await getAttachmentForMedia(db, mediaId);

				enqueueUpload(
					record.localUri,
					record.mimeType,
					record.id,
					attachment?.entityType,
					attachment?.entityId,
					attachment ? undefined : record.scopeType,
				);
				triggerSync();
			} catch (error) {
				onError?.(
					mediaId,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
			}
		},
		[db, enqueueUpload, onError, t, triggerSync],
	);

	return useMemo(
		() => ({
			handleDelete,
			handleFilesSelected,
			handleRetry,
		}),
		[handleDelete, handleFilesSelected, handleRetry],
	);
}
