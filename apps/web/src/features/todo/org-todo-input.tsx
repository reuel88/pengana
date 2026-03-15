import { useTranslation } from "@pengana/i18n";
import { createTodoActions, orgTodoConfig } from "@pengana/todo-client";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { toast } from "sonner";
import { useOrgSync } from "@/features/sync/sync-context";
import { appDb } from "@/shared/db";

const todoActions = createTodoActions(appDb, orgTodoConfig);

export function OrgTodoInput({
	organizationId,
	userId,
}: {
	organizationId: string;
	userId: string;
}) {
	const { triggerSync } = useOrgSync();
	const { t } = useTranslation();

	return (
		<TodoInputBase
			onSubmit={async (title) => {
				await todoActions.addTodo(
					organizationId,
					userId,
					organizationId,
					title,
				);
				triggerSync();
			}}
			onError={() => toast.error(t("errors:failedToAddTodo"))}
		/>
	);
}
