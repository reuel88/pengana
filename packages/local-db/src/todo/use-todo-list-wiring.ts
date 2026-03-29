import { useMemo } from "react";

import type { TodoHandlerDeps } from "./use-todo-handlers";
import { useTodoHandlers } from "./use-todo-handlers";

export function useTodoListWiring(config: TodoHandlerDeps) {
	const deps: TodoHandlerDeps = useMemo(
		() => ({
			userId: config.userId,
			scopeId: config.scopeId,
			organizationId: config.organizationId,
			fileStorage: config.fileStorage,
			t: config.t,
			actions: config.actions,
			scopeType: config.scopeType,
			mediaActions: config.mediaActions,
		}),
		[config],
	);

	return useTodoHandlers(deps);
}
