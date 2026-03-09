import { useTranslation } from "@pengana/i18n";
import { isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@pengana/sync-engine";
import { storeFileInMemory } from "@pengana/todo-client";

import { useSync } from "@/features/sync/sync-context";

import { attachFile } from "../todo-actions";

export function useFilePicker(todoId: string) {
	const { enqueueUpload } = useSync();
	const { t } = useTranslation();

	const showPicker = () => {
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

			// URL is retained for display after success; caller is responsible for revocation.
			const localUri = URL.createObjectURL(file);
			try {
				await attachFile(todoId, localUri);
				storeFileInMemory(todoId, file);
				enqueueUpload(todoId, localUri, file.type);
			} catch {
				URL.revokeObjectURL(localUri);
				window.alert(t("errors:failedToAttachFile"));
			}
		};

		input.click();
	};

	return { showPicker };
}
