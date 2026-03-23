import type { UploadLifecycleCallbacks } from "@pengana/sync/upload";
import type { EntityDatabase } from "../../dexie";

import { markMediaFailed, updateMediaUploaded } from "./dexie-media-actions";

export function createUploadLifecycleCallbacks(
	db: EntityDatabase,
): UploadLifecycleCallbacks {
	return {
		async onCompleted(
			attachmentUrl: string,
			uploadItemId: string,
		): Promise<void> {
			await updateMediaUploaded(db, uploadItemId, attachmentUrl);
		},

		async onFailed(uploadItemId: string): Promise<void> {
			await markMediaFailed(db, uploadItemId);
		},
	};
}
