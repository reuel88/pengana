// Entity definition
export {
	type AttachmentLocalFields,
	defineEntity,
	type EntityDefinition,
	type EntityScoping,
	type SyncableBase,
} from "./define-entity";
export {
	createDexieActions,
	type DexieActions,
} from "./dexie/create-dexie-actions";
export {
	createDexieSyncAdapter,
	type DexieSyncAdapterConfig,
} from "./dexie/create-dexie-sync-adapter";
// Dexie (web)
export {
	EntityDatabase,
	type RawStoreDefinition,
} from "./dexie/entity-database";
export {
	createDrizzleActions,
	type DrizzleActions,
} from "./drizzle/create-drizzle-actions";
export {
	createDrizzleSyncAdapter,
	type DrizzleSyncAdapterConfig,
} from "./drizzle/create-drizzle-sync-adapter";
// Drizzle (native)
export { syncableColumns } from "./drizzle/syncable-columns";

// Hooks
export { useDexieEntity } from "./hooks/use-dexie-entity";
