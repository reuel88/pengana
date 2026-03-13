import { type EntityDatabase, useDexieEntity } from "@pengana/entity-store";

import type { WebOrgTodo } from "../lib/db";

export function useOrgTodos(db: EntityDatabase, organizationId: string) {
	const { items, conflicts } = useDexieEntity<WebOrgTodo>(
		db,
		"orgTodos",
		organizationId,
	);
	return { todos: items, conflictTodos: conflicts };
}
