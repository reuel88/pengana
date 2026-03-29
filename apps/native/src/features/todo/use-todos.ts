import { useTodosDrizzle } from "@pengana/local-db/todo/use-todo-drizzle";

import { appDb, media, mediaAttachments, todos } from "@/shared/db";

export function useTodos(userId: string, _organizationId?: string) {
	return useTodosDrizzle({
		db: appDb,
		todosTable: todos,
		mediaTable: media,
		mediaAttachmentTable: mediaAttachments,
		scopeId: userId,
	});
}

export function useOrgTodos(organizationId: string) {
	return useTodosDrizzle({
		db: appDb,
		todosTable: todos,
		mediaTable: media,
		mediaAttachmentTable: mediaAttachments,
		scopeId: organizationId,
	});
}
