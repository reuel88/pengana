import type { EntityDefinition } from "@pengana/entity-store";

import type { WebTodo } from "./db";
import { todoEntity } from "./todo-entity";

export interface TodoConfig {
	entity: EntityDefinition;
	syncKeyPrefix: string;
	scopeType: "personal" | "org";
	buildNewTodo: (params: {
		scopeId: string;
		userId: string;
		organizationId: string;
		title: string;
	}) => Omit<WebTodo, "id">;
}

export const personalTodoConfig: TodoConfig = {
	entity: todoEntity,
	syncKeyPrefix: "lastSyncedAt",
	scopeType: "personal",
	buildNewTodo: ({ scopeId, userId, organizationId, title }) => ({
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		scopeId: scopeId,
		userId: userId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "personal",
	}),
};

export const orgTodoConfig: TodoConfig = {
	entity: todoEntity,
	syncKeyPrefix: "lastSyncedAt:org",
	scopeType: "org",
	buildNewTodo: ({ scopeId, userId, organizationId, title }) => ({
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		scopeId: scopeId,
		userId: userId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "org",
	}),
};
