import { useTranslation } from "@pengana/i18n";
import type { EnqueueUploadParams } from "@pengana/upload-queue";
import {
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/upload-queue";
import { storeFileInDexie } from "@/features/upload-queue/file-store.web";

export function useFilePickerBase(deps: {
	addMedia: (options: {
		userId: string;
		localUri: string;
		mimeType: string;
		scopeType: "personal" | "org";
		scopeId: string;
		organizationId: string;
		createdBy: string;
	}) => Promise<string>;
	attachMedia: (
		mediaId: string,
		entityType: string,
		entityId: string,
	) => Promise<string>;
	updateMediaLocalUri: (mediaId: string, localUri: string) => Promise<void>;
	enqueueUpload: (params: EnqueueUploadParams) => void;
	getMediaCount: (entityId: string) => Promise<number>;
	entityType: string;
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	createdBy: string;
}) {
	const { t } = useTranslation();

	const showPickerForTodo = (todoId: string) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/jpeg,image/png,image/heic,application/pdf";
		input.multiple = true;

		input.onchange = async () => {
			const files = input.files;
			if (!files || files.length === 0) return;

			let currentCount: number;
			try {
				currentCount = await deps.getMediaCount(todoId);
			} catch {
				window.alert(t("errors:failedToAttachFile"));
				return;
			}
			const available = Math.max(0, MAX_ATTACHMENTS - currentCount);

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
					const mediaId = await deps.addMedia({
						userId: deps.userId,
						localUri: "",
						mimeType: file.type,
						scopeType: deps.scopeType,
						scopeId: deps.scopeId,
						organizationId: deps.organizationId,
						createdBy: deps.createdBy,
					});
					await deps.attachMedia(mediaId, deps.entityType, todoId);
					await storeFileInDexie(mediaId, file);
					const localUri = `${INDEXEDDB_URI_PREFIX}${mediaId}`;
					await deps.updateMediaLocalUri(mediaId, localUri);
					deps.enqueueUpload({
						fileUri: localUri,
						mimeType: file.type,
						mediaId,
						entityType: deps.entityType,
						entityId: todoId,
					});
				} catch {
					window.alert(t("errors:failedToAttachFile"));
				}
			}
		};

		input.click();
	};

	return { showPickerForTodo };
}
