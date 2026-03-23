import { useTodos as useTodosWithAttachments } from "@pengana/local-db/todo";
import { useMemo } from "react";

import { appDb } from "@/shared/db";

export function useTodos(userId: string, organizationId?: string) {
	const orgFilter = useMemo(() => {
		return (t: { organizationId: string }) =>
			t.organizationId === organizationId;
	}, [organizationId]);
	return useTodosWithAttachments(appDb, userId, orgFilter);
}

export function useOrgTodos(organizationId: string) {
	return useTodosWithAttachments(appDb, organizationId);
}
