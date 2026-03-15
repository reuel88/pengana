import {
	applyOrgDesignPresetToDocument,
	DEFAULT_ORG_DESIGN_PRESET,
	normalizeOrgDesignPreset,
} from "@pengana/org-client";
import { useEffect, useState } from "react";
import { useTheme } from "@/features/theme/theme-provider";
import { authClient } from "@/shared/lib/auth-client";

export function OrgDesignPresetSync() {
	const { data: session } = authClient.useSession();
	const { resolvedTheme } = useTheme();
	const [designPreset, setDesignPreset] = useState(DEFAULT_ORG_DESIGN_PRESET);

	useEffect(() => {
		const activeOrganizationId = session?.session.activeOrganizationId;

		if (!activeOrganizationId) {
			setDesignPreset(DEFAULT_ORG_DESIGN_PRESET);
			return;
		}

		let cancelled = false;

		void authClient.organization
			.getFullOrganization()
			.then(({ data }) => {
				if (cancelled) {
					return;
				}

				setDesignPreset(
					normalizeOrgDesignPreset(
						data?.id === activeOrganizationId
							? data.designPreset
							: DEFAULT_ORG_DESIGN_PRESET,
					),
				);
			})
			.catch(() => {
				if (!cancelled) {
					setDesignPreset(DEFAULT_ORG_DESIGN_PRESET);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [session?.session.activeOrganizationId]);

	useEffect(() => {
		applyOrgDesignPresetToDocument(
			designPreset,
			resolvedTheme === "light" ? "light" : "dark",
		);
	}, [designPreset, resolvedTheme]);

	return null;
}
