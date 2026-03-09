import { useTranslation } from "@pengana/i18n";
import type { ReactNode } from "react";

import { useActiveOrg } from "@/hooks/use-org-queries";

type ActiveOrg = NonNullable<ReturnType<typeof useActiveOrg>["data"]>;

export function OrgGuard({
	children,
}: {
	children: (org: ActiveOrg) => ReactNode;
}) {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();

	if (isPending) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	return <>{children(activeOrg)}</>;
}
