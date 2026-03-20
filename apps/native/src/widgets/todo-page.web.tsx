import { useState } from "react";
import { OrgSyncProvider, SyncProvider } from "@/features/sync/sync-context";
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
	organizationId: string;
}) {
	const [activeTab, setActiveTab] = useState<TodoTab>("personal");

	return (
		<div style={{ flex: 1, overflowY: "auto" }}>
			<TodoShell activeTab={activeTab} onTabChange={setActiveTab} />

			{activeTab === "personal" && (
				<SyncProvider userId={userId} organizationId={organizationId}>
					<div data-testid="personal-todo-panel">
						<PersonalTodoContent
							userId={userId}
							organizationId={organizationId}
						/>
					</div>
				</SyncProvider>
			)}
			{activeTab === "organization" && (
				<OrgSyncProvider organizationId={organizationId} userId={userId}>
					<div data-testid="organization-todo-panel">
						<OrganizationTodoContent
							organizationId={organizationId}
							userId={userId}
						/>
					</div>
				</OrgSyncProvider>
			)}
		</div>
	);
}
