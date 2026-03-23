import { createDexieUploadTransport as createPackageDexieUploadTransport } from "@pengana/local-db/media";
import type { UploadTransport } from "@pengana/sync/upload";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db/db.web";

export function createDexieUploadTransport(): UploadTransport {
	return createPackageDexieUploadTransport({
		rpc: client.upload,
		db: appDb,
	});
}
