import { useTranslation } from "@pengana/i18n";
import { useTodos } from "@pengana/todo-client";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { LanguageSwitcher } from "@/features/i18n/language-switcher.tsx";
import { SyncProvider, useSync } from "@/features/sync/sync-context";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";

function TodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(userId);
	const { isOnline, isSyncing } = useSync();
	const { t } = useTranslation("todos");

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-xl">{t("title")}</h1>
				<LanguageSwitcher />
			</div>
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
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
