import { useTranslation } from "@pengana/i18n";
import type { TodoActions } from "@pengana/todo-client";
import {
	addOrgTodo,
	addTodo,
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
	useOrgTodos,
	useTodos,
} from "@pengana/todo-client";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { useMemo, useState } from "react";
import { LanguageSwitcher } from "@/features/i18n/language-switcher.tsx";
import { OrgSyncProvider, useOrgSync } from "@/features/sync/org-sync-context";
import { SyncProvider, useSync } from "@/features/sync/sync-context";
import { useBackgroundPort } from "@/features/sync/use-background-port";
import { ModeToggle } from "@/features/theme/mode-toggle";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import type { SyncScope } from "@/shared/api/background-messages";
import { appDb } from "@/shared/db";

const orgActions: TodoActions = {
	toggleTodo: (id) => toggleOrgTodo(appDb, id),
	deleteTodo: (id) => deleteOrgTodo(appDb, id),
	resolveConflict: (id, resolution) =>
		resolveOrgConflict(appDb, id, resolution),
};

type Tab = "personal" | "organization";

function TodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(appDb, userId);
	const sync = useSync();

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={sync.isOnline} isSyncing={sync.isSyncing} />
			<TodoInput
				onAdd={(title) => addTodo(appDb, userId, title)}
				triggerSync={sync.triggerSync}
			/>
			<TodoList todos={todos} syncHook={sync} userId={userId} />
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
	const sync = useOrgSync();

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={sync.isOnline} isSyncing={sync.isSyncing} />
			<TodoInput
				onAdd={(title) => addOrgTodo(appDb, organizationId, userId, title)}
				triggerSync={sync.triggerSync}
			/>
			<TodoList
				todos={todos}
				syncHook={sync}
				actions={orgActions}
				entityType="orgTodo"
				userId={userId}
			/>
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
				<div className="flex items-center gap-2">
					<ModeToggle />
					<LanguageSwitcher />
				</div>
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
				{organizationId ? (
					<div
						id="panel-personal"
						role="tabpanel"
						aria-labelledby="tab-personal"
						className={activeTab !== "personal" ? "hidden" : undefined}
					>
						<TodoContent userId={userId} />
					</div>
				) : (
					<div>
						<TodoContent userId={userId} />
					</div>
				)}
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
