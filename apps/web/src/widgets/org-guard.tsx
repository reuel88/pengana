import { useTranslation } from "@pengana/i18n";
import type { ReactNode } from "react";

import { useActiveOrg } from "@/shared/hooks/use-org-queries";

export type ActiveOrg = NonNullable<ReturnType<typeof useActiveOrg>["data"]>;

export function useOrgGuard() {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();

	let guardElement: ReactNode = null;
	if (isPending) {
		guardElement = <p>{t("common:status.loading")}</p>;
	} else if (!activeOrg) {
		guardElement = <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	return { activeOrg, guardElement };
}

export function OrgGuard({
	children,
}: {
	children: (org: ActiveOrg) => ReactNode;
}) {
	const { activeOrg, guardElement } = useOrgGuard();

	if (guardElement || !activeOrg) return <>{guardElement}</>;

	return <>{children(activeOrg)}</>;
}
