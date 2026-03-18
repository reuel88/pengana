import { useTranslation } from "@pengana/i18n";
import {
	createTodoActions,
	orgTodoConfig,
	personalTodoConfig,
	useTodos,
} from "@pengana/todo-client";
import { ConnectivityBanner } from "@pengana/ui/components/connectivity-banner";
import { useMemo, useState } from "react";
import {
	OrgSyncProvider,
	SyncProvider,
	useOrgSync,
	useSync,
} from "@/features/sync/sync-context";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
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

			<SyncDevtools />
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

	return (
		<div
			className="mx-auto flex max-w-lg flex-col gap-4 p-4"
			data-testid="todo-page"
		>
			<h1 className="font-bold text-xl">{t("title")}</h1>

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

			{activeTab === "organization" && (
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
