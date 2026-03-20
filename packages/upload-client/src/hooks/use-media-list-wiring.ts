import type { EntityDatabase } from "@pengana/entity-store";
import type { EnqueueUploadParams } from "@pengana/upload-queue";
import { useMemo } from "react";

import type { MediaConfig } from "../lib/media-config";
import type {
	MediaFileStorageStrategy,
	MediaHandlerDeps,
} from "./use-media-handlers";
import { useMediaHandlers } from "./use-media-handlers";

export interface UseMediaListWiringConfig {
	db: EntityDatabase;

	triggerSync: () => void;
	enqueueUpload: (params: EnqueueUploadParams) => void;

	userId: string;
	scopeId: string;
	organizationId: string;
	config: MediaConfig;
	fileStorage: MediaFileStorageStrategy;
	deleteMedia?: (mediaId: string) => Promise<unknown>;
	onError?: (id: string | null, message: string) => void;
	onDeleteSuccess?: (mediaId: string) => void;
	onUploadEnqueued?: () => void;
	t: (key: string) => string;
}

export function useMediaListWiring(config: UseMediaListWiringConfig) {
	const deps: MediaHandlerDeps = useMemo(
		() => ({
			db: config.db,
			triggerSync: config.triggerSync,
			enqueueUpload: config.enqueueUpload,
			userId: config.userId,
			scopeId: config.scopeId,
			organizationId: config.organizationId,
			config: config.config,
			fileStorage: config.fileStorage,
			t: config.t,
			deleteMedia: config.deleteMedia,
			onError: config.onError,
			onDeleteSuccess: config.onDeleteSuccess,
			onUploadEnqueued: config.onUploadEnqueued,
		}),
		[config],
	);

	return useMediaHandlers(deps);
}
