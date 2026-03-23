import type { EntityDefinition } from "../core";

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
		hlcTimestamp: string;
	}) => Omit<WebTodo, "id">;
}

export const personalTodoConfig: TodoConfig = {
	entity: todoEntity,
	syncKeyPrefix: "lastSyncedAt",
	scopeType: "personal",
	buildNewTodo: ({ scopeId, userId, organizationId, title, hlcTimestamp }) => ({
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		hlcTimestamp,
		fieldClocks: {
			title: hlcTimestamp,
			completed: hlcTimestamp,
			deleted: hlcTimestamp,
		},
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
	buildNewTodo: ({ scopeId, userId, organizationId, title, hlcTimestamp }) => ({
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		hlcTimestamp,
		fieldClocks: {
			title: hlcTimestamp,
			completed: hlcTimestamp,
			deleted: hlcTimestamp,
		},
		scopeId: scopeId,
		userId: userId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "org",
	}),
};
