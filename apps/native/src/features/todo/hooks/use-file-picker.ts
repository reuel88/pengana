import { useSync } from "@/features/sync/sync-context";

import { addMedia, getMediaCountForEntity } from "../todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useFilePicker(userId: string) {
	const { enqueueUpload } = useSync();
	return useFilePickerBase({
		addMedia,
		enqueueUpload,
		getMediaCount: getMediaCountForEntity,
		entityType: "todo",
		userId,
	});
}
