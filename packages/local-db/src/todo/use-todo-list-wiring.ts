import { useMemo } from "react";

import type { TodoHandlerDeps } from "./use-todo-handlers";
import { useTodoHandlers } from "./use-todo-handlers";

export function useTodoListWiring(config: TodoHandlerDeps) {
	const deps: TodoHandlerDeps = useMemo(
		() => ({
			triggerSync: config.triggerSync,
			enqueueUpload: config.enqueueUpload,
			userId: config.userId,
			scopeId: config.scopeId,
			organizationId: config.organizationId,
			fileStorage: config.fileStorage,
			t: config.t,
			onError: config.onError,
			onDeleteSuccess: config.onDeleteSuccess,
			deleteAttachment: config.deleteAttachment,
			clearError: config.clearError,
			actions: config.actions,
			entityType: config.entityType,
			scopeType: config.scopeType,
			mediaActions: config.mediaActions,
			getMediaCountForEntity: config.getMediaCountForEntity,
		}),
		[config],
	);

	return useTodoHandlers(deps);
}
