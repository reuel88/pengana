import { createDrizzleUploadAdapter } from "@pengana/upload-client";

import { appDb } from "@/shared/db/db";
import { uploadQueue } from "./schema";

export function createNativeUploadAdapter() {
	return createDrizzleUploadAdapter(appDb, uploadQueue);
}
