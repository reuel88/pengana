import type { EntityDatabase } from "@pengana/entity-store";
import { useMemo } from "react";

import type {
	FileStorageStrategy,
	TodoActions,
	TodoHandlerDeps,
} from "./use-todo-handlers";
import { useTodoHandlers } from "./use-todo-handlers";

interface UseTodoListWiringConfigBase {
	triggerSync: () => void;
	enqueueUpload: (
		entityType: string,
		entityId: string,
		fileUri: string,
		mimeType: string,
		mediaId: string,
	) => void;
	entityType?: string;
	userId?: string;
	fileStorage: FileStorageStrategy;
	onError: (id: string, message: string) => void;
	clearError: (id: string) => void;
	onDeleteSuccess?: (id: string) => void;
	deleteAttachment?: (attachmentId: string) => Promise<unknown>;
	t: (key: string) => string;
}

export type UseTodoListWiringConfig =
	| (UseTodoListWiringConfigBase & {
			actions: TodoActions;
			db?: EntityDatabase;
	  })
	| (UseTodoListWiringConfigBase & {
			actions?: undefined;
			db: EntityDatabase;
	  });

export function useTodoListWiring(config: UseTodoListWiringConfig) {
	const {
		triggerSync,
		enqueueUpload,
		fileStorage,
		onError,
		clearError,
		onDeleteSuccess,
		deleteAttachment,
		t,
		actions,
		db,
		entityType,
		userId,
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
			deleteAttachment,
			actions,
			db,
			entityType,
			userId,
		}),
		[
			triggerSync,
			enqueueUpload,
			onError,
			clearError,
			fileStorage,
			t,
			onDeleteSuccess,
			deleteAttachment,
			actions,
			db,
			entityType,
			userId,
		],
	);

	return useTodoHandlers(deps);
}
