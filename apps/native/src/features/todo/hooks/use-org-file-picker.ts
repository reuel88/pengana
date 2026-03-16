import { useOrgSync } from "@/features/sync/org-sync-context";

import {
	addMedia,
	getMediaCountForEntity,
	updateMediaLocalUri,
} from "../todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useOrgFilePicker(userId: string, orgId: string) {
	const { enqueueUpload } = useOrgSync();
	return useFilePickerBase({
		addMedia,
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
