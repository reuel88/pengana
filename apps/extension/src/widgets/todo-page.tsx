import { useTranslation } from "@pengana/i18n";
import { useTodos } from "@pengana/local-db/todo";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { useMemo, useState } from "react";
import { LanguageSwitcher } from "@/features/i18n/language-switcher.tsx";
import { useBackgroundPort } from "@/features/sync/use-background-port";
import { useSyncEntry } from "@/features/sync/use-sync-entry";
import { ModeToggle } from "@/features/theme/mode-toggle";
import * as orgActions from "@/features/todo/org-todo-actions";
import * as personalActions from "@/features/todo/todo-actions";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import type { SyncScope } from "@/shared/api/background-messages";
import { appDb } from "@/shared/db";

type Tab = "personal" | "organization";

function PersonalTodoContent({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const orgFilter = useMemo(() => {
		return (t: { organizationId: string }) =>
			t.organizationId === organizationId;
	}, [organizationId]);
	const { todos } = useTodos(appDb, userId, orgFilter);
	const sync = useSyncEntry({
		scopeType: "personal",
		scopeId: userId,
		entityKey: "todo",
	});

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={sync.isOnline} isSyncing={sync.isSyncing} />
			<TodoInput
				onAdd={(title) =>
					personalActions.addTodo(userId, title, organizationId)
				}
				triggerSync={sync.triggerSync}
			/>
			<TodoList
				todos={todos}
				syncHook={sync}
				entityType="todo"
				userId={userId}
				scopeType="personal"
				scopeId={userId}
				organizationId={organizationId}
				actions={personalActions}
			/>
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
	const { todos } = useTodos(appDb, organizationId);
	const sync = useSyncEntry({
		scopeType: "organization",
		scopeId: organizationId,
		entityKey: "todo",
	});

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={sync.isOnline} isSyncing={sync.isSyncing} />
			<TodoInput
				onAdd={(title) => orgActions.addOrgTodo(organizationId, userId, title)}
				triggerSync={sync.triggerSync}
			/>
			<TodoList
				todos={todos}
				syncHook={sync}
				entityType="todo"
				userId={userId}
				scopeType="org"
				scopeId={userId}
				organizationId={organizationId}
				actions={orgActions}
			/>
		</div>
	);
}

export function TodoPage({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const { t } = useTranslation("todos");
	const [activeTab, setActiveTab] = useState<Tab>("personal");

	const scopes = useMemo<SyncScope[]>(
		() => [
			{ scopeType: "personal", scopeId: userId },
			{ scopeType: "organization", scopeId: organizationId },
		],
		[userId, organizationId],
	);

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

			{activeTab === "personal" && (
				<div id="panel-personal" role="tabpanel" aria-labelledby="tab-personal">
					<PersonalTodoContent
						userId={userId}
						organizationId={organizationId}
					/>
				</div>
			)}

			{activeTab === "organization" && (
				<div
					id="panel-organization"
					role="tabpanel"
					aria-labelledby="tab-organization"
				>
					<OrgTodoContent organizationId={organizationId} userId={userId} />
				</div>
			)}
		</div>
	);
}
