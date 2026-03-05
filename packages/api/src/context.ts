import { auth } from "@pengana/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	return {
		session,
	};
}

type BaseContext = Awaited<ReturnType<typeof createContext>>;
export type Context = BaseContext & {
	notifyUser?: (userId: string) => void;
};
