import {
	applyOrgDesignPresetToDocument,
	DEFAULT_ORG_DESIGN_PRESET,
	normalizeOrgDesignPreset,
} from "@pengana/org-client";
import { useEffect } from "react";
import { useOrgDesignPresetPreview } from "@/features/theme/org-design-preset-preview";
import { useTheme } from "@/features/theme/theme-provider";
import { useActiveOrg } from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";

export function OrgDesignPresetSync() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { data: activeOrg } = useActiveOrg({
		enabled: !sessionPending && !!session,
	});
	const { resolvedTheme } = useTheme();
	const { previewDesignPreset } = useOrgDesignPresetPreview();

	useEffect(() => {
		applyOrgDesignPresetToDocument(
			normalizeOrgDesignPreset(
				previewDesignPreset ??
					activeOrg?.designPreset ??
					DEFAULT_ORG_DESIGN_PRESET,
			),
			resolvedTheme === "light" ? "light" : "dark",
		);

		return () => {
			document.documentElement.dataset.orgStyle =
				DEFAULT_ORG_DESIGN_PRESET.style;
			document.documentElement.dataset.orgIconLibrary =
				DEFAULT_ORG_DESIGN_PRESET.iconLibrary;
			document.documentElement.dataset.orgMenu = DEFAULT_ORG_DESIGN_PRESET.menu;
			document.documentElement.dataset.orgMenuAccent =
				DEFAULT_ORG_DESIGN_PRESET.menuAccent;
		};
	}, [activeOrg?.designPreset, previewDesignPreset, resolvedTheme]);

	return null;
}
