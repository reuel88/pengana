import type { RouterClient } from "@orpc/server";
import { z } from "zod";

import {
	envelope,
	envelopeOutput,
	protectedProcedure,
	publicProcedure,
} from "../index";
import { billingRouter } from "./billing";
import { notificationRouter } from "./notification";
import { orgTodoRouter } from "./org-todo";
import { todoRouter } from "./todo";
import { uploadRouter } from "./upload";

const userOutputSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	emailVerified: z.boolean(),
	image: z.string().nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const appRouter = {
	healthCheck: publicProcedure
		.route({ method: "GET", path: "/health", summary: "Health check" })
		.output(envelopeOutput(z.string()))
		.handler(() => {
			return envelope("OK");
		}),
	privateData: protectedProcedure
		.route({
			method: "GET",
			path: "/private",
			summary: "Get private user data",
		})
		.output(
			envelopeOutput(z.object({ message: z.string(), user: userOutputSchema })),
		)
		.handler(({ context }) => {
			return envelope({
				message: "This is private",
				user: context.session?.user,
			});
		}),
	billing: billingRouter,
	notification: notificationRouter,
	orgTodo: orgTodoRouter,
	todo: todoRouter,
	upload: uploadRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
