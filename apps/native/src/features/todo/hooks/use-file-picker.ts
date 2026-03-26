import { useSyncEntry } from "@/features/sync/use-sync-entry";

import {
	addMedia,
	attachMedia,
	getMediaCountForEntity,
	updateMediaLocalUri,
} from "../todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useFilePicker(userId: string, organizationId: string) {
	const { enqueueUpload } = useSyncEntry({
		scopeType: "personal",
		scopeId: userId,
		entityKey: "sync",
	});
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
