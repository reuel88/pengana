import { useState } from "react";
import { OrgSyncProvider } from "@/features/sync/org-sync-context";
import { SyncProvider } from "@/features/sync/sync-context";
import {
	OrganizationTodoContent,
	PersonalTodoContent,
	TodoShell,
	type TodoTab,
} from "./todo-content";

export function TodoPage({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId?: string;
}) {
	const [activeTab, setActiveTab] = useState<TodoTab>("personal");

	return (
		<>
			<TodoShell
				activeTab={activeTab}
				onTabChange={setActiveTab}
				showTabs={Boolean(organizationId)}
			/>
			<SyncProvider userId={userId}>
				<div
					data-testid="personal-todo-panel"
					style={{
						display:
							activeTab !== "personal" && organizationId ? "none" : undefined,
					}}
				>
					<PersonalTodoContent userId={userId} />
				</div>
			</SyncProvider>
			{organizationId ? (
				<OrgSyncProvider organizationId={organizationId} userId={userId}>
					<div
						data-testid="organization-todo-panel"
						style={{
							display: activeTab !== "organization" ? "none" : undefined,
						}}
					>
						<OrganizationTodoContent
							organizationId={organizationId}
							userId={userId}
						/>
					</div>
				</OrgSyncProvider>
			) : null}
		</>
	);
}
