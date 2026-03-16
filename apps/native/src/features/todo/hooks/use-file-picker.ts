import { useSync } from "@/features/sync/sync-context";

import {
	addMedia,
	getMediaCountForEntity,
	updateMediaLocalUri,
} from "../todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useFilePicker(userId: string) {
	const { enqueueUpload } = useSync();
	return useFilePickerBase({
		addMedia,
		updateMediaLocalUri,
		enqueueUpload,
		getMediaCount: getMediaCountForEntity,
		entityType: "todo",
		userId,
	});
}
