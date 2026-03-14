import { useTranslation } from "@pengana/i18n";
import type { ReactNode } from "react";

import { useActiveOrg } from "@/shared/hooks/use-org-queries";

export type ActiveOrg = NonNullable<ReturnType<typeof useActiveOrg>["data"]>;

type OrgGuardResult =
	| { ready: true; activeOrg: ActiveOrg; guardElement?: undefined }
	| { ready: false; activeOrg?: undefined; guardElement: ReactNode };

export function useOrgGuard(): OrgGuardResult {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending, isError } = useActiveOrg();

	if (isPending) {
		return { ready: false, guardElement: <p>{t("common:status.loading")}</p> };
	}
	if (isError) {
		return { ready: false, guardElement: <p>{t("common:status.error")}</p> };
	}
	if (!activeOrg) {
		return { ready: false, guardElement: <p>{t("noActiveOrgFound")}</p> };
	}

	return { ready: true, activeOrg };
}

export function OrgGuard({
	children,
}: {
	children: (org: ActiveOrg) => ReactNode;
}) {
	const guard = useOrgGuard();

	if (!guard.ready) return <>{guard.guardElement}</>;

	return <>{children(guard.activeOrg)}</>;
}
