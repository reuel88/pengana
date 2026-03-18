import { useTranslation } from "@pengana/i18n";
import { useCallback } from "react";
import { Alert } from "react-native";

import { client } from "@/shared/api/orpc";

import { getAttachmentForMedia, retryMedia } from "./todo-actions";

export function useAttachmentHandlers(
	removeMediaFn: (attachmentId: string) => Promise<void>,
	triggerSync: () => void,
	enqueueUpload: (
		localUri: string,
		mimeType: string,
		id: string,
		entityType?: string,
		entityId?: string,
		scopeType?: "personal" | "org",
	) => void,
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
					enqueueUpload(
						record.localUri,
						record.mimeType,
						record.id,
						att?.entityType,
						att?.entityId,
					);
				}
			} catch {
				Alert.alert(t("error.title"), t("errors:failedToRetryAttachment"));
			}
		},
		[enqueueUpload, t],
	);

	return { handleRemoveAttachment, handleRetryAttachment };
}
