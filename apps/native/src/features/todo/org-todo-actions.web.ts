import { createTodoActions, orgTodoConfig } from "@pengana/todo-client";
import { appDb } from "@/shared/db";

const actions = createTodoActions(appDb, orgTodoConfig);

export const addOrgTodo = (
	organizationId: string,
	userId: string,
	title: string,
) => actions.addTodo(organizationId, userId, organizationId, title);

export const toggleOrgTodo = (id: string) => actions.toggleTodo(id);

export const deleteOrgTodo = (id: string) => actions.deleteTodo(id);

export const resolveOrgConflict = (
	id: string,
	resolution: "local" | "server",
) => actions.resolveConflict(id, resolution);
