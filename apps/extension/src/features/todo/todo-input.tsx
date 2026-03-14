import { TodoInput as TodoInputBase } from "@pengana/ui/components/todo-input";

export function TodoInput({
	onAdd,
	triggerSync,
}: {
	onAdd: (title: string) => Promise<void>;
	triggerSync: () => void;
}) {
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
		/>
	);
}
