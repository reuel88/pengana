import type { UploadAdapter } from "../types";

export interface CleanupDeps {
	uploadAdapter: UploadAdapter;
	removeFile?: (entityId: string) => Promise<void>;
}

/** Removes completed upload queue items and their associated file blobs. */
export async function cleanupUploaded(deps: CleanupDeps): Promise<number> {
	const items = await deps.uploadAdapter.getQueueItems();
	const uploaded = items.filter((item) => item.status === "uploaded");

	for (const item of uploaded) {
		if (deps.removeFile) {
			await deps.removeFile(item.entityId);
		}
		await deps.uploadAdapter.removeItem(item.id);
	}

	return uploaded.length;
}

/** Removes failed upload items older than the given number of days. */
export async function cleanupFailedOlderThan(
	deps: CleanupDeps,
	days: number,
): Promise<number> {
	const items = await deps.uploadAdapter.getQueueItems();
	const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
	const stale = items.filter(
		(item) =>
			item.status === "failed" && new Date(item.createdAt).getTime() < cutoff,
	);

	for (const item of stale) {
		if (deps.removeFile) {
			await deps.removeFile(item.entityId);
		}
		await deps.uploadAdapter.removeItem(item.id);
	}

	return stale.length;
}
