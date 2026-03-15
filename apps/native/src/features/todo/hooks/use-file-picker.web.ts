import { useTranslation } from "@pengana/i18n";
import {
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync-engine";
import { storeFileInIndexedDB } from "@/features/sync/entities/upload-queue/file-store.web";

import { useSync } from "@/features/sync/sync-context";

import { addMedia, getMediaCountForEntity } from "../todo-actions";

const MAX_ATTACHMENTS = 10;

export function useFilePicker(userId: string) {
	const { enqueueUpload } = useSync();
	const { t } = useTranslation();

	const showPickerForTodo = (todoId: string) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/jpeg,image/png,image/heic,application/pdf";
		input.multiple = true;

		input.onchange = async () => {
			const files = input.files;
			if (!files || files.length === 0) return;

			const currentCount = await getMediaCountForEntity(todoId);
			const available = MAX_ATTACHMENTS - currentCount;

			for (let i = 0; i < Math.min(files.length, available); i++) {
				const file = files[i];

				if (!isAllowedMimeType(file.type)) {
					window.alert(t("errors:invalidFileType"));
					continue;
				}

				if (file.size > MAX_FILE_SIZE_BYTES) {
					window.alert(t("errors:fileTooLarge"));
					continue;
				}

				try {
					const mediaId = await addMedia(
						todoId,
						"todo",
						userId,
						`${INDEXEDDB_URI_PREFIX}${todoId}`,
						file.type,
					);
					await storeFileInIndexedDB(mediaId, file);
					enqueueUpload(
						"todo",
						todoId,
						`${INDEXEDDB_URI_PREFIX}${mediaId}`,
						file.type,
						mediaId,
					);
				} catch {
					window.alert(t("errors:failedToAttachFile"));
				}
			}
		};

		input.click();
	};

	return { showPickerForTodo };
}
