import { SyncRuntime } from "@pengana/sync/runtime";
import { nativePlatformDeps } from "./sync-runtime-config";

export const syncRuntime = new SyncRuntime(nativePlatformDeps);
