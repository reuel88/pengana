import { defineEntity } from "@pengana/entity-store";

export const mediaEntity = defineEntity({
	name: "media",
	indexes: "id, entityId, userId",
	scoping: "both",
});
