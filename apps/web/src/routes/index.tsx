import { createFileRoute, redirect } from "@tanstack/react-router";

import { requireAuthAndOrg } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	async beforeLoad() {
		await requireAuthAndOrg();
		throw redirect({ to: "/dashboard" });
	},
	component: () => null,
});
