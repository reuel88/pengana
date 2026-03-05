import { ConnectivityBanner } from "@/features/sync/connectivity-banner";
import { SyncProvider } from "@/features/sync/sync-context";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import { useTodos } from "@/features/todo/use-todos";

function TodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(userId);

	return (
		<div className="flex flex-col gap-4 p-4">
			<h1 className="font-bold text-xl">Todos</h1>
			<ConnectivityBanner />
			<TodoInput userId={userId} />
			<TodoList todos={todos} />
		</div>
	);
}

export function TodoPage({ userId }: { userId: string }) {
	return (
		<SyncProvider userId={userId}>
			<TodoContent userId={userId} />
		</SyncProvider>
	);
}
