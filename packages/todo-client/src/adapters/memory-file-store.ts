const MAX_STORED_FILES = 50;
const fileStore = new Map<string, File>();

export function storeFileInMemory(todoId: string, file: File): void {
	if (fileStore.size >= MAX_STORED_FILES && !fileStore.has(todoId)) {
		const oldest = fileStore.keys().next().value;
		if (oldest !== undefined) fileStore.delete(oldest);
	}
	fileStore.set(todoId, file);
}

export function getFileFromMemory(todoId: string): File | undefined {
	return fileStore.get(todoId);
}

export function removeFileFromMemory(todoId: string): void {
	fileStore.delete(todoId);
}
