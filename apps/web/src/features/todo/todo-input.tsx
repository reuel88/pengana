import { useTranslation } from "@pengana/i18n";
import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";
import { toast } from "sonner";

export function TodoInput({
	onAdd,
	triggerSync,
}: {
	onAdd: (title: string) => Promise<void>;
	triggerSync: () => void;
}) {
	const { t } = useTranslation();

	return (
		<TodoInputBase
			onSubmit={async (title) => {
				try {
					await onAdd(title);
					triggerSync();
				} catch (err) {
					console.error("[TodoInput] failed to add todo:", err);
				}
			}}
			onError={() => toast.error(t("errors:failedToAddTodo"))}
		/>
	);
}
