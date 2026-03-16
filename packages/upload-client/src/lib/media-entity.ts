import { defineEntity } from "@pengana/entity-store";

export const mediaEntity = defineEntity({
	name: "media",
	indexes: "id, entityId, userId, scopeType, scopeId, organizationId",
	scoping: "both",
});
