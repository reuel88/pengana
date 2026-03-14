import { useOrgSync } from "@/features/sync/org-sync-context";

import { addOrgTodo } from "./org-todo-actions";
import { TodoInputBase } from "./todo-input-base";

export function OrgTodoInput({
	organizationId,
	userId,
}: {
	organizationId: string;
	userId: string;
}) {
	const { triggerSync } = useOrgSync();

	return (
		<TodoInputBase
			onAdd={(title) => addOrgTodo(organizationId, userId, title)}
			triggerSync={triggerSync}
		/>
	);
}
