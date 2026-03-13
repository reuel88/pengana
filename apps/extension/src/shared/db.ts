import { EntityDatabase } from "@pengana/entity-store";
import { orgTodoEntity, todoEntity } from "@pengana/todo-client";

export const appDb = new EntityDatabase("TodoDatabase")
	.applySchema(1, [todoEntity])
	.applySchema(2, [todoEntity])
	.applySchema(3, [todoEntity, orgTodoEntity]);
