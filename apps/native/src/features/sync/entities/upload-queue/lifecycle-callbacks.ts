import type { UploadLifecycleCallbacks } from "@pengana/sync-engine";
import { eq } from "drizzle-orm";

import { appDb } from "@/shared/db/db";
import { media } from "@/shared/db/schema";

export function createNativeUploadLifecycleCallbacks(): UploadLifecycleCallbacks {
	return {
		async onCompleted(url: string, uploadItemId: string): Promise<void> {
			await appDb
				.update(media)
				.set({
					url,
					status: "uploaded",
				})
				.where(eq(media.id, uploadItemId));
		},

		async onFailed(uploadItemId: string): Promise<void> {
			await appDb
				.update(media)
				.set({
					status: "failed",
				})
				.where(eq(media.id, uploadItemId));
		},
	};
}
