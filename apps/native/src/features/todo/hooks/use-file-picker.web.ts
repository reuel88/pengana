import { useTranslation } from "@pengana/i18n";
import {
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync-engine";
import { storeFileInIndexedDB } from "@pengana/todo-client/adapters/dexie-file-store";

import { useSync } from "@/features/sync/sync-context";

import { attachFile } from "../todo-actions";

export function useFilePicker() {
	const { enqueueUpload } = useSync();
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
				await attachFile(todoId, localUri);
				enqueueUpload("todo", todoId, localUri, file.type);
			} catch {
				window.alert(t("errors:failedToAttachFile"));
			}
		};

		input.click();
	};

	return { showPickerForTodo };
}
