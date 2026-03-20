import { auth } from "@pengana/auth";
import { resolveWebBaseUrl } from "@pengana/auth/lib/web-url";
import { env } from "@pengana/env/server";
import { getServerT } from "@pengana/i18n/server";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

type CreateContextResult = {
	session: Awaited<ReturnType<typeof auth.api.getSession>>;
	locale: string;
	t: ReturnType<typeof getServerT>;
	headers: Headers;
	webBaseUrl: string;
};

export async function createContext({
	context,
}: CreateContextOptions): Promise<CreateContextResult> {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	const locale = (context.get("language") as string) ?? "en-US";
	return {
		session,
		locale,
		t: getServerT(locale),
		headers: context.req.raw.headers,
		webBaseUrl: resolveWebBaseUrl(env),
	};
}

type BaseContext = Awaited<ReturnType<typeof createContext>>;
export type Context = BaseContext & {
	notifyUser: (userId: string, kind?: "sync" | "refresh") => void;
	notifyOrgMembers: (orgId: string, kind?: "sync" | "refresh") => void;
};
