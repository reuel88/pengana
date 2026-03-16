export interface WebTodo {
	id: string;
	title: string;
	completed: boolean;
	updatedAt: string;
	userId: string; // sync engine scope key (userId for personal, organizationId for org)
	organizationId: string | null; // null when user has no org
	createdBy: string; // always present — who created the 2do
	syncStatus: "synced" | "pending" | "conflict";
	deleted: boolean;
	scopeType: "personal" | "org";
}
