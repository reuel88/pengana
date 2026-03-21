import { useState } from "react";
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
				<div data-testid="personal-todo-panel">
					<PersonalTodoContent
						userId={userId}
						organizationId={organizationId}
					/>
				</div>
			)}
			{activeTab === "organization" && (
				<div data-testid="organization-todo-panel">
					<OrganizationTodoContent
						organizationId={organizationId}
						userId={userId}
					/>
				</div>
			)}
		</div>
	);
}
