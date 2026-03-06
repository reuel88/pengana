import { useTranslation } from "@pengana/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ConnectivityBanner } from "@/features/sync/connectivity-banner";
import { SyncProvider } from "@/features/sync/sync-context";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import { useTodos } from "@/features/todo/use-todos";

function TodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(userId);
	const { t } = useTranslation("todos");

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-xl">{t("title")}</h1>
				<LanguageSwitcher />
			</div>
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
