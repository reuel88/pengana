import { useSync } from "@/features/sync/sync-context";

import { attachFile } from "../todo-actions";

import { useFilePickerBase } from "./use-file-picker-base";

export function useFilePicker() {
	const { enqueueUpload } = useSync();
	return useFilePickerBase({
		attachFile,
		enqueueUpload,
		entityType: "todo",
	});
}
