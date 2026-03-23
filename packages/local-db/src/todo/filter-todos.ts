interface Filterable {
	deleted?: boolean | null;
	syncStatus?: string | null;
}

export function filterTodos<T extends Filterable>(allTodos: T[]) {
	const activeTodos = allTodos.filter((todo) => !todo.deleted);
	const conflictTodos = allTodos.filter(
		(todo) => todo.syncStatus === "conflict",
	);
	return { activeTodos, conflictTodos };
}
