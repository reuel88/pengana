import {
	ALLOWED_MIME_TYPES,
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync-engine";
import {
	addMedia,
	storeFileInIndexedDB,
	updateMediaLocalUri,
} from "@pengana/upload-client";
import { useCallback } from "react";
import { toast } from "sonner";

import { useSync } from "@/features/sync/sync-context";
import { appDb } from "@/shared/db";

export function useStandaloneUpload({
	userId,
	organizationId,
	t,
	onUploadEnqueued,
}: {
	userId: string;
	organizationId?: string;
	t: (key: string) => string;
	onUploadEnqueued?: () => void;
}) {
	const { enqueueUpload, triggerSync } = useSync();

	const uploadFiles = useCallback(
		async (files: File[]) => {
			for (const file of files) {
				if (!isAllowedMimeType(file.type)) {
					toast.error(t("dropzone.rejected.type"));
					continue;
				}
				if (file.size > MAX_FILE_SIZE_BYTES) {
					toast.error(t("dropzone.rejected.size"));
					continue;
				}

				const scopeType = organizationId ? "org" : "personal";
				const scopeId = organizationId ?? userId;

				const mediaId = await addMedia(appDb, {
					userId,
					localUri: "",
					mimeType: file.type,
					scopeType,
					scopeId,
					organizationId: organizationId ?? null,
					createdBy: userId,
				});

				await storeFileInIndexedDB(appDb, mediaId, file);
				await updateMediaLocalUri(appDb, mediaId, `indexeddb://${mediaId}`);

				enqueueUpload(`indexeddb://${mediaId}`, file.type, mediaId);
			}

			triggerSync();
			onUploadEnqueued?.();
		},
		[userId, organizationId, enqueueUpload, triggerSync, t, onUploadEnqueued],
	);

	return { uploadFiles, allowedMimeTypes: ALLOWED_MIME_TYPES };
}
