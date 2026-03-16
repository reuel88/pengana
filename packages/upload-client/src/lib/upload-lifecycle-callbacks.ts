import type { EntityDatabase } from "@pengana/entity-store";
import type { UploadLifecycleCallbacks } from "@pengana/sync-engine";

import { markMediaFailed, updateMediaUploaded } from "./media-actions";

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
