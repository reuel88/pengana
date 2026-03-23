import type { RawStoreDefinition } from "../../dexie";

export interface FileDataRecord {
	entityId: string;
	base64: string;
	mimeType: string;
	fileName: string;
}

export const uploadQueueStore: RawStoreDefinition = {
	name: "uploadQueue",
	indexes: "id, status, createdAt, entityType, entityId",
};

export const fileDataStore: RawStoreDefinition = {
	name: "fileData",
	indexes: "entityId",
};

export const uploadRawStores: RawStoreDefinition[] = [
	uploadQueueStore,
	fileDataStore,
];
