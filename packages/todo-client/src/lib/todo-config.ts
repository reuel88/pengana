import type { EntityDefinition } from "@pengana/entity-store";

import type { WebTodo } from "./db";
import { todoEntity } from "./todo-entity";

export interface TodoConfig {
	entity: EntityDefinition;
	syncKeyPrefix: string;
	scopeType: "personal" | "org";
	buildNewTodo: (params: {
		scopeId: string;
		actorId: string;
		organizationId: string | null;
		title: string;
	}) => Omit<WebTodo, "id">;
}

export const personalTodoConfig: TodoConfig = {
	entity: todoEntity,
	syncKeyPrefix: "lastSyncedAt",
	scopeType: "personal",
	buildNewTodo: ({ scopeId, actorId, organizationId, title }) => ({
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: scopeId,
		organizationId,
		createdBy: actorId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "personal",
	}),
};

export const orgTodoConfig: TodoConfig = {
	entity: todoEntity,
	syncKeyPrefix: "lastSyncedAt:org",
	scopeType: "org",
	buildNewTodo: ({ scopeId, actorId, organizationId, title }) => ({
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: scopeId, // org-scoped: userId = organizationId for sync engine
		organizationId,
		createdBy: actorId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "org",
	}),
};
