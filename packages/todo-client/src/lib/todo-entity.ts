import { defineEntity } from "@pengana/entity-store";

export const todoEntity = defineEntity({
	name: "todos",
	indexes: "id, userId, organizationId, syncStatus, updatedAt, scopeType",
	scoping: "both",
});
