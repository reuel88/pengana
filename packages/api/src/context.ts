import { auth } from "@pengana/auth";
import { getServerT } from "@pengana/i18n/server";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	const locale = (context.get("language") as string) ?? "en-US";
	return {
		session,
		locale,
		t: getServerT(locale),
		headers: context.req.raw.headers,
	};
}

type BaseContext = Awaited<ReturnType<typeof createContext>>;
export type Context = BaseContext & {
	notifyUser?: (userId: string) => void;
	notifyOrgMembers?: (orgId: string, excludeUserId: string) => void;
};
