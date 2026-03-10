import { SyncProvider } from "@/features/sync/sync-context";
import { TodoContent } from "./todo-content";

export function TodoPage({ userId }: { userId: string }) {
	return (
		<SyncProvider userId={userId}>
			<TodoContent userId={userId} />
		</SyncProvider>
	);
}
