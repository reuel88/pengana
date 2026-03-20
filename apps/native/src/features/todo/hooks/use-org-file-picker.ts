import { useOrgSync } from "@/features/sync/sync-context";

import {
	addMedia,
	attachMedia,
	getMediaCountForEntity,
	updateMediaLocalUri,
} from "../todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useOrgFilePicker(userId: string, orgId: string) {
	const { enqueueUpload } = useOrgSync();
	return useFilePickerBase({
		addMedia,
		attachMedia,
		updateMediaLocalUri,
		enqueueUpload,
		getMediaCount: getMediaCountForEntity,
		entityType: "todo",
		userId,
		scopeType: "org",
		scopeId: orgId,
		organizationId: orgId,
		createdBy: userId,
	});
}
