import type { RawStoreDefinition } from "@pengana/entity-store";

export interface FileDataRecord {
	entityId: string;
	base64: string;
	mimeType: string;
	fileName: string;
}

export const uploadQueueStore: RawStoreDefinition = {
	name: "uploadQueue",
	indexes: "id, entityType, entityId, status, createdAt",
};

export const fileDataStore: RawStoreDefinition = {
	name: "fileData",
	indexes: "entityId",
};

export const uploadRawStores: RawStoreDefinition[] = [
	uploadQueueStore,
	fileDataStore,
];
