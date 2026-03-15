import { EntityDatabase } from "@pengana/entity-store";
import {
	mediaEntity,
	orgTodoEntity,
	todoEntity,
	uploadRawStores,
} from "@pengana/todo-client";

export const appDb = new EntityDatabase("AppDatabase")
	.applySchema(1, [todoEntity])
	.applySchema(2, [todoEntity])
	.applySchema(3, [todoEntity, orgTodoEntity])
	.applySchema(4, [todoEntity, orgTodoEntity], uploadRawStores)
	.applySchema(5, [todoEntity, orgTodoEntity], uploadRawStores)
	.applySchema(6, [todoEntity, orgTodoEntity, mediaEntity], uploadRawStores);
