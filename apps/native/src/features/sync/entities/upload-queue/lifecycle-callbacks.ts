import type { UploadLifecycleCallbacks } from "@pengana/sync-engine";
import { eq } from "drizzle-orm";

import { appDb } from "@/features/todo/entities/todo/db";
import { media } from "@/features/todo/entities/todo/schema";

export function createNativeUploadLifecycleCallbacks(): UploadLifecycleCallbacks {
	return {
		async onCompleted(
			_entityType: string,
			_entityId: string,
			url: string,
			uploadItemId: string,
		): Promise<void> {
			await appDb
				.update(media)
				.set({
					url,
					status: "uploaded",
				})
				.where(eq(media.id, uploadItemId));
		},

		async onFailed(
			_entityType: string,
			_entityId: string,
			uploadItemId: string,
		): Promise<void> {
			await appDb
				.update(media)
				.set({
					status: "failed",
				})
				.where(eq(media.id, uploadItemId));
		},
	};
}
