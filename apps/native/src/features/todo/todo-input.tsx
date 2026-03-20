import { TodoInputBase } from "./todo-input-base";

export function TodoInput({
	onAdd,
	triggerSync,
}: {
	onAdd: (title: string) => Promise<void>;
	triggerSync: () => void;
}) {
	return <TodoInputBase onAdd={onAdd} triggerSync={triggerSync} />;
}
