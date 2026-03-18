import { useTranslation } from "@pengana/i18n";
import {
	createTodoActions,
	orgTodoConfig,
	personalTodoConfig,
	useTodos,
} from "@pengana/todo-client";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { useMemo, useState } from "react";
import { LanguageSwitcher } from "@/features/i18n/language-switcher.tsx";
import {
	OrgSyncProvider,
	SyncProvider,
	useOrgSync,
	useSync,
} from "@/features/sync/sync-context";
import { useBackgroundPort } from "@/features/sync/use-background-port";
import { ModeToggle } from "@/features/theme/mode-toggle";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import type { SyncScope } from "@/shared/api/background-messages";
import { appDb } from "@/shared/db";

const personalActions = createTodoActions(appDb, personalTodoConfig);
const orgActions = createTodoActions(appDb, orgTodoConfig);

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
	const sync = useSync();

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={sync.isOnline} isSyncing={sync.isSyncing} />
			<TodoInput
				onAdd={(title) =>
					personalActions.addTodo(userId, userId, organizationId, title)
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
	const sync = useOrgSync();

	return (
		<div className="flex flex-col gap-4">
			<ConnectivityBanner isOnline={sync.isOnline} isSyncing={sync.isSyncing} />
			<TodoInput
				onAdd={(title) =>
					orgActions.addTodo(organizationId, userId, organizationId, title)
				}
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
	organizationId: string | undefined;
}) {
	const { t } = useTranslation("todos");
	const [activeTab, setActiveTab] = useState<Tab>("personal");

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

			{activeTab === "personal" && organizationId && (
				<SyncProvider userId={userId} organizationId={organizationId}>
					<div
						id="panel-personal"
						role="tabpanel"
						aria-labelledby="tab-personal"
					>
						<PersonalTodoContent
							userId={userId}
							organizationId={organizationId}
						/>
					</div>
				</SyncProvider>
			)}

			{activeTab === "organization" && organizationId && (
				<OrgSyncProvider organizationId={organizationId} userId={userId}>
					<div
						id="panel-organization"
						role="tabpanel"
						aria-labelledby="tab-organization"
					>
						<OrgTodoContent organizationId={organizationId} userId={userId} />
					</div>
				</OrgSyncProvider>
			)}
		</div>
	);
}
