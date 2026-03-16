import { useTranslation } from "@pengana/i18n";
import { useCallback } from "react";
import { Alert } from "react-native";

import { client } from "@/shared/api/orpc";

import { retryMedia } from "./todo-actions";

export function useAttachmentHandlers(
	removeMediaFn: (attachmentId: string) => Promise<void>,
	triggerSync: () => void,
	enqueueUpload: (
		entityType: string,
		entityId: string,
		localUri: string,
		mimeType: string,
		id: string,
	) => void,
) {
	const { t } = useTranslation("todos");

	const handleRemoveAttachment = useCallback(
		async (attachmentId: string) => {
			try {
				await removeMediaFn(attachmentId);
				client.upload.deleteAttachment({ attachmentId }).catch(() => {});
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
				if (record?.localUri && record.entityType && record.entityId) {
					enqueueUpload(
						record.entityType,
						record.entityId,
						record.localUri,
						record.mimeType,
						record.id,
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
