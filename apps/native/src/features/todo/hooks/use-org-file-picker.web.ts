import { useTranslation } from "@pengana/i18n";
import {
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync-engine";
import { storeFileInIndexedDB } from "@pengana/todo-client/adapters/dexie-file-store";

import { useOrgSync } from "@/features/sync/org-sync-context";

import { attachOrgFile } from "../org-todo-actions";

export function useOrgFilePicker() {
	const { enqueueUpload } = useOrgSync();
	const { t } = useTranslation();

	const showPickerForTodo = (todoId: string) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/jpeg,image/png,image/heic,application/pdf";

		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;

			if (!isAllowedMimeType(file.type)) {
				window.alert(t("errors:invalidFileType"));
				return;
			}

			if (file.size > MAX_FILE_SIZE_BYTES) {
				window.alert(t("errors:fileTooLarge"));
				return;
			}

			const localUri = `${INDEXEDDB_URI_PREFIX}${todoId}`;
			try {
				await storeFileInIndexedDB(todoId, file);
				await attachOrgFile(todoId, localUri);
				enqueueUpload(todoId, localUri, file.type);
			} catch {
				window.alert(t("errors:failedToAttachFile"));
			}
		};

		input.click();
	};

	return { showPickerForTodo };
}
