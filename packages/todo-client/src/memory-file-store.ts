const MAX_STORED_FILES = 50;
const fileStore = new Map<string, File>();

export function storeFileForUpload(todoId: string, file: File): void {
	if (fileStore.size >= MAX_STORED_FILES && !fileStore.has(todoId)) {
		const oldest = fileStore.keys().next().value;
		if (oldest !== undefined) fileStore.delete(oldest);
	}
	fileStore.set(todoId, file);
}

export function getFileForUpload(todoId: string): File | undefined {
	return fileStore.get(todoId);
}

export function removeFileForUpload(todoId: string): void {
	fileStore.delete(todoId);
}
