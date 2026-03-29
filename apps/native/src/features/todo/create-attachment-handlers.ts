import { useTranslation } from "@pengana/i18n";
import type { EnqueueUploadParams } from "@pengana/sync/upload";
import { useCallback } from "react";
import { Alert } from "react-native";

import { client } from "@/shared/api/orpc";

import { getAttachmentForMedia, retryMedia } from "./todo-actions";

export function useAttachmentHandlers(
	removeMediaFn: (mediaId: string) => Promise<void>,
	triggerSync: () => void,
	enqueueUpload: (params: EnqueueUploadParams) => void,
) {
	const { t } = useTranslation("todos");

	const handleRemoveAttachment = useCallback(
		async (mediaId: string) => {
			try {
				await removeMediaFn(mediaId);
				client.upload.deleteMedia({ mediaId }).catch((err) => {
					if (__DEV__)
						console.warn(
							"Failed to delete attachment on server:",
							mediaId,
							err,
						);
				});
				triggerSync();
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToDeleteAttachment"));
			}
		},
		[removeMediaFn, triggerSync, t],
	);

	const handleRetryAttachment = useCallback(
		async (mediaId: string) => {
			try {
				const record = await retryMedia(mediaId);
				if (record?.localUri) {
					const att = await getAttachmentForMedia(mediaId);
					enqueueUpload({
						fileUri: record.localUri,
						mimeType: record.mimeType,
						mediaId: record.id,
						entityType: att?.entityType,
						entityId: att?.entityId,
					});
				}
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToRetryAttachment"));
			}
		},
		[enqueueUpload, t],
	);

	return { handleRemoveAttachment, handleRetryAttachment };
}
