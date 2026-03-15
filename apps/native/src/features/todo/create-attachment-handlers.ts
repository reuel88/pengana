import { useCallback } from "react";

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
	const handleRemoveAttachment = useCallback(
		async (attachmentId: string) => {
			await removeMediaFn(attachmentId);
			client.upload.deleteAttachment({ attachmentId }).catch(() => {});
			triggerSync();
		},
		[removeMediaFn, triggerSync],
	);

	const handleRetryAttachment = useCallback(
		async (attachmentId: string) => {
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
		},
		[enqueueUpload],
	);

	return { handleRemoveAttachment, handleRetryAttachment };
}
