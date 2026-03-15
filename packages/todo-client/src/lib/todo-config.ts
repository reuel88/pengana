import type { EntityDefinition } from "@pengana/entity-store";

import type { WebTodo } from "./db";
import { orgTodoEntity, todoEntity } from "./todo-entity";

export interface TodoConfig {
	entity: EntityDefinition;
	syncKeyPrefix: string;
	buildNewTodo: (params: {
		scopeId: string;
		actorId: string;
		organizationId: string;
		title: string;
	}) => Omit<WebTodo, "id">;
}

export const personalTodoConfig: TodoConfig = {
	entity: todoEntity,
	syncKeyPrefix: "lastSyncedAt",
	buildNewTodo: ({ scopeId, actorId, organizationId, title }) => ({
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: scopeId,
		organizationId,
		createdBy: actorId,
		syncStatus: "pending",
		deleted: false,
	}),
};

export const orgTodoConfig: TodoConfig = {
	entity: orgTodoEntity,
	syncKeyPrefix: "lastSyncedAt:org",
	buildNewTodo: ({ scopeId, actorId, organizationId, title }) => ({
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: scopeId, // org-scoped: userId = organizationId for sync engine
		organizationId,
		createdBy: actorId,
		syncStatus: "pending",
		deleted: false,
	}),
};
