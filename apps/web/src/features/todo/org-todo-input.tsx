import { useTranslation } from "@pengana/i18n";
import { addOrgTodo } from "@pengana/todo-client";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { toast } from "sonner";
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
	const { t } = useTranslation();

	return (
		<TodoInputBase
			onSubmit={async (title) => {
				await addOrgTodo(appDb, organizationId, userId, title);
				triggerSync();
			}}
			onError={() => toast.error(t("errors:failedToAddTodo"))}
		/>
	);
}
