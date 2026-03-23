import { createDrizzleUploadAdapter } from "@pengana/local-db/media";

import { appDb } from "@/shared/db/db";
import { uploadQueue } from "./schema";

export function createNativeUploadAdapter() {
	return createDrizzleUploadAdapter(appDb, uploadQueue);
}
