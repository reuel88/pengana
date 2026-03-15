import { EntityDatabase } from "@pengana/entity-store";
import { orgTodoEntity, todoEntity } from "@pengana/todo-client";
import { mediaEntity, uploadRawStores } from "@pengana/upload-client";

export const appDb = new EntityDatabase("AppDatabase")
	.applySchema(1, [todoEntity])
	// v2: no-op — kept for users who upgraded to v2 before v3 was added
	.applySchema(2, [todoEntity])
	.applySchema(3, [todoEntity, orgTodoEntity])
	.applySchema(4, [todoEntity, orgTodoEntity], uploadRawStores)
	.applySchema(5, [todoEntity, orgTodoEntity], uploadRawStores)
	.applySchema(6, [todoEntity, orgTodoEntity, mediaEntity], uploadRawStores)
	.applySchema(7, [todoEntity, orgTodoEntity, mediaEntity], uploadRawStores);
