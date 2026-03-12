import { useTranslation } from "@pengana/i18n";
import { useOrgTodos, useTodos } from "@pengana/todo-client";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { useState } from "react";
import { OrgSyncProvider, useOrgSync } from "@/features/sync/org-sync-context";
import { SyncProvider, useSync } from "@/features/sync/sync-context";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { OrgTodoInput } from "@/features/todo/org-todo-input";
import { OrgTodoList } from "@/features/todo/org-todo-list";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";

type Tab = "personal" | "organization";

function PersonalTodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(userId);
	const { isOnline, isSyncing } = useSync();

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
			<TodoInput userId={userId} />
			<TodoList todos={todos} />
			<SyncDevtools />
		</div>
	);
}

function OrgTodoContent({
	organizationId,
	userId,
}: {
	organizationId: string;
	userId: string;
}) {
	const { todos } = useOrgTodos(organizationId);
	const { isOnline, isSyncing } = useOrgSync();

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
			<OrgTodoInput organizationId={organizationId} userId={userId} />
			<OrgTodoList todos={todos} />
		</div>
	);
}

export function TodoPage({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId?: string;
}) {
	const [activeTab, setActiveTab] = useState<Tab>("personal");
	const { t } = useTranslation("todos");

	return (
		<div
			className="mx-auto flex max-w-lg flex-col gap-4 p-4"
			data-testid="todo-page"
		>
			<h1 className="font-bold text-xl">{t("title")}</h1>

			{organizationId && (
				<div className="flex gap-2 border-b">
					<button
						type="button"
						className={`px-3 py-2 font-medium text-sm ${
							activeTab === "personal"
								? "border-current border-b-2"
								: "opacity-60"
						}`}
						onClick={() => setActiveTab("personal")}
					>
						{t("tabs.personal")}
					</button>
					<button
						type="button"
						className={`px-3 py-2 font-medium text-sm ${
							activeTab === "organization"
								? "border-current border-b-2"
								: "opacity-60"
						}`}
						onClick={() => setActiveTab("organization")}
					>
						{t("tabs.organization")}
					</button>
				</div>
			)}

			<SyncProvider userId={userId}>
				<div className={activeTab !== "personal" ? "hidden" : undefined}>
					<PersonalTodoContent userId={userId} />
				</div>
			</SyncProvider>

			{organizationId && (
				<OrgSyncProvider organizationId={organizationId}>
					<div className={activeTab !== "organization" ? "hidden" : undefined}>
						<OrgTodoContent organizationId={organizationId} userId={userId} />
					</div>
				</OrgSyncProvider>
			)}
		</div>
	);
}
