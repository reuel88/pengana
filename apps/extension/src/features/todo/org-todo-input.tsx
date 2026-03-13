import { addOrgTodo } from "@pengana/todo-client";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { useOrgSync } from "@/features/sync/org-sync-context";
import { appDb } from "@/shared/db";

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
			onSubmit={async (title) => {
				try {
					await addOrgTodo(appDb, organizationId, userId, title);
					triggerSync();
				} catch (err) {
					console.error("[OrgTodoInput] failed to add org todo:", err);
				}
			}}
		/>
	);
}
