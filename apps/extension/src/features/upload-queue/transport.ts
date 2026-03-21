import type { UploadTransport } from "@pengana/sync/upload";
import { createDexieUploadTransport as createPackageDexieUploadTransport } from "@pengana/upload-client";

import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

export function createDexieUploadTransport(): UploadTransport {
	return createPackageDexieUploadTransport({
		rpc: client.upload,
		db: appDb,
	});
}
