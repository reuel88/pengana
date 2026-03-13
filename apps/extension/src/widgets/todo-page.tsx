import { useTranslation } from "@pengana/i18n";
import { useOrgTodos, useTodos } from "@pengana/todo-client";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { useMemo, useState } from "react";
import { LanguageSwitcher } from "@/features/i18n/language-switcher.tsx";
import { OrgSyncProvider, useOrgSync } from "@/features/sync/org-sync-context";
import { SyncProvider, useSync } from "@/features/sync/sync-context";
import { useBackgroundPort } from "@/features/sync/use-background-port";
import { OrgTodoInput } from "@/features/todo/org-todo-input";
import { OrgTodoList } from "@/features/todo/org-todo-list";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import type { SyncScope } from "@/shared/api/background-messages";
import { appDb } from "@/shared/db";

type Tab = "personal" | "organization";

function TodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(appDb, userId);
	const { isOnline, isSyncing } = useSync();

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
			<TodoInput userId={userId} />
			<TodoList todos={todos} />
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
	const { todos } = useOrgTodos(appDb, organizationId);
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

	const scopes = useMemo<SyncScope[]>(() => {
		const s: SyncScope[] = [{ scopeType: "personal", scopeId: userId }];
		if (organizationId) {
			s.push({ scopeType: "organization", scopeId: organizationId });
		}
		return s;
	}, [userId, organizationId]);

	useBackgroundPort(scopes);

	return (
		<div className="flex flex-col gap-4 p-4" data-testid="todo-page">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-xl">{t("title")}</h1>
				<LanguageSwitcher />
			</div>
			{organizationId ? (
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
			) : null}
			<SyncProvider userId={userId}>
				<div
					id="panel-personal"
					role="tabpanel"
					aria-labelledby="tab-personal"
					className={
						activeTab !== "personal" && organizationId ? "hidden" : undefined
					}
				>
					<TodoContent userId={userId} />
				</div>
			</SyncProvider>
			{organizationId ? (
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
			) : null}
		</div>
	);
}
