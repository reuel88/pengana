import type { UploadLifecycleCallbacks } from "@pengana/upload-queue";

import type { DrizzleDb, MediaTable } from "./drizzle-media-actions";
import { markMediaFailed, updateMediaUploaded } from "./drizzle-media-actions";

export function createDrizzleUploadLifecycleCallbacks(
	db: DrizzleDb,
	mediaTable: MediaTable,
): UploadLifecycleCallbacks {
	return {
		async onCompleted(
			attachmentUrl: string,
			uploadItemId: string,
		): Promise<void> {
			await updateMediaUploaded(db, mediaTable, uploadItemId, attachmentUrl);
		},

		async onFailed(uploadItemId: string): Promise<void> {
			await markMediaFailed(db, mediaTable, uploadItemId);
		},
	};
}
