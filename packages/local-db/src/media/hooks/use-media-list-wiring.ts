import { useMemo } from "react";

import type { MediaConfig } from "../lib/media-config";
import type { MediaActions } from "./media-actions";
import type {
	MediaFileStorageStrategy,
	MediaHandlerDeps,
} from "./use-media-handlers";
import { useMediaHandlers } from "./use-media-handlers";

export interface UseMediaListWiringConfig {
	actions: MediaActions;
	userId: string;
	scopeId: string;
	organizationId: string;
	config: MediaConfig;
	fileStorage: MediaFileStorageStrategy;
	deleteMedia?: (mediaId: string) => Promise<unknown>;
	onError?: (id: string | null, message: string) => void;
	onDeleteSuccess?: (mediaId: string) => void;
	t: (key: string) => string;
}

export function useMediaListWiring(config: UseMediaListWiringConfig) {
	const deps: MediaHandlerDeps = useMemo(
		() => ({
			actions: config.actions,
			userId: config.userId,
			scopeId: config.scopeId,
			organizationId: config.organizationId,
			config: config.config,
			fileStorage: config.fileStorage,
			t: config.t,
			deleteMedia: config.deleteMedia,
			onError: config.onError,
			onDeleteSuccess: config.onDeleteSuccess,
		}),
		[config],
	);

	return useMediaHandlers(deps);
}
