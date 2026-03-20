import { useSync } from "@/features/sync/sync-context";

import {
	addMedia,
	attachMedia,
	getMediaCountForEntity,
	updateMediaLocalUri,
} from "../todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useFilePicker(userId: string, organizationId: string) {
	const { enqueueUpload } = useSync();
	return useFilePickerBase({
		addMedia,
		attachMedia,
		updateMediaLocalUri,
		enqueueUpload,
		getMediaCount: getMediaCountForEntity,
		entityType: "todo",
		userId,
		scopeType: "personal",
		scopeId: userId,
		organizationId,
		createdBy: userId,
	});
}
