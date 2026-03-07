import { useTranslation } from "@pengana/i18n";
import { useTodos } from "@pengana/todo-client";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { SyncProvider, useSync } from "@/features/sync/sync-context";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";

function TodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(userId);
	const { isOnline, isSyncing } = useSync();
	const { t } = useTranslation("todos");

	return (
		<div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
			<h1 className="font-bold text-xl">{t("title")}</h1>
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
			<TodoInput userId={userId} />
			<TodoList todos={todos} />
			<SyncDevtools />
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
