import { uploadQueueDb } from "@pengana/todo-client";

export async function storeFileForUpload(
	todoId: string,
	file: File,
): Promise<void> {
	const base64 = await fileToBase64(file);
	await uploadQueueDb.fileData.put({
		todoId,
		base64,
		mimeType: file.type,
		fileName: file.name,
	});
}

export async function getFileForUpload(
	todoId: string,
): Promise<{ base64: string; mimeType: string; fileName: string } | undefined> {
	return uploadQueueDb.fileData.get(todoId);
}

export async function removeFileForUpload(todoId: string): Promise<void> {
	await uploadQueueDb.fileData.delete(todoId);
}

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			const base64 = result.split(",")[1];
			if (!base64) {
				reject(new Error("Failed to extract base64 data from file"));
				return;
			}
			resolve(base64);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
