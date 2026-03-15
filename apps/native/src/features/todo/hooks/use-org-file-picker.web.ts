import { useTranslation } from "@pengana/i18n";
import {
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync-engine";
import { storeFileInIndexedDB } from "@/features/sync/entities/upload-queue/file-store.web";

import { useOrgSync } from "@/features/sync/org-sync-context";

import { addOrgMedia, getOrgMediaCountForEntity } from "../org-todo-actions";

const MAX_ATTACHMENTS = 10;

export function useOrgFilePicker(userId: string) {
	const { enqueueUpload } = useOrgSync();
	const { t } = useTranslation();

	const showPickerForTodo = (todoId: string) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/jpeg,image/png,image/heic,application/pdf";
		input.multiple = true;

		input.onchange = async () => {
			const files = input.files;
			if (!files || files.length === 0) return;

			const currentCount = await getOrgMediaCountForEntity(todoId);
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
					const mediaId = await addOrgMedia(
						todoId,
						"orgTodo",
						userId,
						`${INDEXEDDB_URI_PREFIX}${todoId}`,
						file.type,
					);
					await storeFileInIndexedDB(mediaId, file);
					enqueueUpload(
						"orgTodo",
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
