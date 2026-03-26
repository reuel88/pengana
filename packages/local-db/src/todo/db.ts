export interface LocalTodo {
	id: string;

	title: string;
	completed: boolean;

	userId: string; // actual user ID (the person who created or owns the 2do)
	scopeId: string; // sync engine scope key (userId for personal, organizationId for org)
	organizationId: string;
	scopeType: "personal" | "org";

	createdBy: string; // always present — who created the 2do
	updatedAt: string;
	hlcTimestamp: string;
	fieldClocks: Record<string, string>;

	syncStatus: "synced" | "pending" | "conflict";
	deleted: boolean;
}
