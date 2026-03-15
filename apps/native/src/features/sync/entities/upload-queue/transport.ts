import type { UploadTransport } from "@pengana/sync-engine";
import { createUploadTransport } from "@pengana/upload-client";

import { File } from "expo-file-system";

import { client } from "@/shared/api/orpc";

export function createNativeUploadTransport(): UploadTransport {
	return createUploadTransport({
		rpc: client.upload,
		async getBase64(input) {
			const file = new File(input.fileUri);
			return file.base64();
		},
	});
}
