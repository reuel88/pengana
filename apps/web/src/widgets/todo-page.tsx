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
			<SyncDevtools />
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
	const showTabs = Boolean(organizationId);

	return (
		<div
			className="mx-auto flex max-w-lg flex-col gap-4 p-4"
			data-testid="todo-page"
		>
			<h1 className="font-bold text-xl">{t("title")}</h1>

			{showTabs && (
				<div className="flex gap-2 border-b" role="tablist">
					{(
						[
							{ key: "personal", label: t("tabs.personal") },
							{ key: "organization", label: t("tabs.organization") },
						] as const
					).map(({ key, label }) => (
						<button
							key={key}
							id={`tab-${key}`}
							type="button"
							role="tab"
							aria-selected={activeTab === key}
							aria-controls={`panel-${key}`}
							className={`px-3 py-2 font-medium text-sm ${
								activeTab === key ? "border-current border-b-2" : "opacity-60"
							}`}
							onClick={() => setActiveTab(key)}
						>
							{label}
						</button>
					))}
				</div>
			)}

			<SyncProvider userId={userId}>
				{showTabs ? (
					<div
						id="panel-personal"
						role="tabpanel"
						aria-labelledby="tab-personal"
						className={activeTab !== "personal" ? "hidden" : undefined}
					>
						<PersonalTodoContent userId={userId} />
					</div>
				) : (
					<div>
						<PersonalTodoContent userId={userId} />
					</div>
				)}
			</SyncProvider>

			{organizationId && (
				<OrgSyncProvider organizationId={organizationId} userId={userId}>
					<div
						id="panel-organization"
						role="tabpanel"
						aria-labelledby="tab-organization"
						className={activeTab !== "organization" ? "hidden" : undefined}
					>
						<OrgTodoContent organizationId={organizationId} userId={userId} />
					</div>
				</OrgSyncProvider>
			)}
		</div>
	);
}
