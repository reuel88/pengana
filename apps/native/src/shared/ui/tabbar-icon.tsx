import type { AppIconName } from "@pengana/org-client";
import { AppIcon } from "@/shared/ui/app-icon";

export const TabBarIcon = (props: { name: AppIconName; color: string }) => {
	return <AppIcon size={24} style={{ marginBottom: -3 }} {...props} />;
};
