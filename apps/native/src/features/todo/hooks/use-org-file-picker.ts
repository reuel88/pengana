import { useOrgSync } from "@/features/sync/org-sync-context";

import { attachFile } from "../todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useOrgFilePicker() {
	const { enqueueUpload } = useOrgSync();
	return useFilePickerBase({
		attachFile,
		enqueueUpload,
		entityType: "orgTodo",
	});
}
