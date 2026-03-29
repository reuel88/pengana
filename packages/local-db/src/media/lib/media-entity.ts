import { defineEntity } from "../../core";

export const mediaEntity = defineEntity({
	name: "media",
	indexes:
		"id, userId, scopeType, scopeId, organizationId, status, syncStatus, deleted",
	scoping: "both",
});

export const mediaAttachmentEntity = defineEntity({
	name: "mediaAttachments",
	indexes: "id, mediaId, entityType, entityId, [entityType+entityId]",
	scoping: "both",
});
