import { EntityDatabase } from "@pengana/entity-store";
import { todoEntity } from "@pengana/todo-client";
import { mediaEntity, uploadRawStores } from "@pengana/upload-client";

export const appDb = new EntityDatabase("AppDatabase")
	.applySchema(1, [todoEntity])
	.applySchema(2, [todoEntity])
	.applySchema(3, [todoEntity])
	.applySchema(4, [todoEntity], uploadRawStores)
	.applySchema(5, [todoEntity], uploadRawStores)
	.applySchema(6, [todoEntity, mediaEntity], uploadRawStores)
	.applySchema(7, [todoEntity, mediaEntity], uploadRawStores)
	.applySchema(8, [todoEntity, mediaEntity], uploadRawStores);
