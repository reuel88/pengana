import type { EntityDatabase } from "@pengana/entity-store";
import { useMemo } from "react";

import type {
	FileStorageStrategy,
	TodoActions,
	TodoHandlerDeps,
} from "./use-todo-handlers";
import { useTodoHandlers } from "./use-todo-handlers";

export interface UseTodoListWiringConfig {
	triggerSync: () => void;
	enqueueUpload: (
		entityType: string,
		entityId: string,
		fileUri: string,
		mimeType: string,
	) => void;
	entityType?: string;
	fileStorage: FileStorageStrategy;
	onError: (id: string, message: string) => void;
	clearError: (id: string) => void;
	onDeleteSuccess?: (id: string) => void;
	t: (key: string) => string;
	/** Pre-bound actions. When omitted, `db` must be provided to construct defaults. */
	actions?: TodoActions;
	/** EntityDatabase instance, required when `actions` is not provided. */
	db?: EntityDatabase;
}

export function useTodoListWiring(config: UseTodoListWiringConfig) {
	const {
		triggerSync,
		enqueueUpload,
		fileStorage,
		onError,
		clearError,
		onDeleteSuccess,
		t,
		actions,
		db,
		entityType,
	} = config;

	const deps: TodoHandlerDeps = useMemo(
		() => ({
			triggerSync,
			enqueueUpload,
			onError,
			clearError,
			fileStorage,
			t,
			onDeleteSuccess,
			actions,
			db,
			entityType,
		}),
		[
			triggerSync,
			enqueueUpload,
			onError,
			clearError,
			fileStorage,
			t,
			onDeleteSuccess,
			actions,
			db,
			entityType,
		],
	);

	return useTodoHandlers(deps);
}
