import { useTranslation } from "@pengana/i18n";
import { addTodo } from "@pengana/todo-client";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { toast } from "sonner";
import { useSync } from "@/features/sync/sync-context";

export function TodoInput({ userId }: { userId: string }) {
	const { triggerSync } = useSync();
	const { t } = useTranslation();

	return (
		<TodoInputBase
			onSubmit={async (title) => {
				await addTodo(userId, title);
				triggerSync();
			}}
			onError={() => toast.error(t("errors:failedToAddTodo"))}
		/>
	);
}
