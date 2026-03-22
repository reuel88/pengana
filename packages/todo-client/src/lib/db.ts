export interface WebTodo {
	id: string;
	title: string;
	completed: boolean;
	updatedAt: string;
	hlcTimestamp: string;
	fieldClocks: Record<string, string>;
	scopeId: string; // sync engine scope key (userId for personal, organizationId for org)
	userId: string; // actual user ID (the person who created or owns the todo)
	organizationId: string;
	createdBy: string; // always present — who created the 2do
	syncStatus: "synced" | "pending" | "conflict";
	deleted: boolean;
	scopeType: "personal" | "org";
}
