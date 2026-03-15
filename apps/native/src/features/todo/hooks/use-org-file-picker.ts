import { useOrgSync } from "@/features/sync/org-sync-context";

import { addOrgMedia, getOrgMediaCountForEntity } from "../org-todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useOrgFilePicker(userId: string) {
	const { enqueueUpload } = useOrgSync();
	return useFilePickerBase({
		addMedia: addOrgMedia,
		enqueueUpload,
		getMediaCount: getOrgMediaCountForEntity,
		entityType: "orgTodo",
		userId,
	});
}
