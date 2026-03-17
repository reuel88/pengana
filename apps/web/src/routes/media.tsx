import { createFileRoute } from "@tanstack/react-router";

import { MediaPage } from "@/features/media/media-page";
import { requireAuthAndOrg } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/media")({
	component: MediaRoute,
	beforeLoad: requireAuthAndOrg,
});

function MediaRoute() {
	const { session } = Route.useRouteContext();
	const userId = session.data.user.id;
	const organizationId = session.data.session.activeOrganizationId ?? undefined;

	return <MediaPage userId={userId} organizationId={organizationId} />;
}
