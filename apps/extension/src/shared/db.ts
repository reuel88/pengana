import { EntityDatabase } from "@pengana/entity-store";
import { todoEntity } from "@pengana/todo-client";
import {
	mediaAttachmentEntity,
	mediaEntity,
	uploadRawStores,
} from "@pengana/upload-client";

export const appDb = new EntityDatabase("AppDatabase")
	.applySchema(1, [todoEntity])
	// v2: no-op — kept for users who upgraded to v2 before v3 was added
	.applySchema(2, [todoEntity])
	.applySchema(3, [todoEntity])
	.applySchema(4, [todoEntity], uploadRawStores)
	.applySchema(5, [todoEntity], uploadRawStores)
	.applySchema(6, [todoEntity, mediaEntity], uploadRawStores)
	.applySchema(7, [todoEntity, mediaEntity], uploadRawStores)
	.applySchema(8, [todoEntity, mediaEntity], uploadRawStores)
	.applySchema(
		9,
		[todoEntity, mediaEntity, mediaAttachmentEntity],
		uploadRawStores,
	)
	.applySchema(
		10,
		[todoEntity, mediaEntity, mediaAttachmentEntity],
		uploadRawStores,
	)
	.applySchema(
		11,
		[todoEntity, mediaEntity, mediaAttachmentEntity],
		uploadRawStores,
	);
