import { useTranslation } from "@pengana/i18n";
import type { EnqueueUploadParams } from "@pengana/upload-queue";
import { useCallback } from "react";
import { Alert } from "react-native";

import { client } from "@/shared/api/orpc";

import { getAttachmentForMedia, retryMedia } from "./todo-actions";

export function useAttachmentHandlers(
	removeMediaFn: (attachmentId: string) => Promise<void>,
	triggerSync: () => void,
	enqueueUpload: (params: EnqueueUploadParams) => void,
) {
	const { t } = useTranslation("todos");

	const handleRemoveAttachment = useCallback(
		async (attachmentId: string) => {
			try {
				await removeMediaFn(attachmentId);
				client.upload.deleteMedia({ mediaId: attachmentId }).catch((err) => {
					if (__DEV__)
						console.warn(
							"Failed to delete attachment on server:",
							attachmentId,
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
		async (attachmentId: string) => {
			try {
				const record = await retryMedia(attachmentId);
				if (record?.localUri) {
					const att = await getAttachmentForMedia(attachmentId);
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
