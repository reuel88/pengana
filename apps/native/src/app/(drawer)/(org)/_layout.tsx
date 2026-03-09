import { useTranslation } from "@pengana/i18n";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { Redirect, Stack } from "expo-router";

import { useThemedScreenOptions } from "@/hooks/use-themed-screen-options";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

export default function OrgLayout() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { data: session, isPending } = authClient.useSession();
	const screenOptions = useThemedScreenOptions();

	if (isPending) {
		return null;
	}

	if (!session) {
		return <Redirect href="/" />;
	}

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: t("title"),
					headerLeft: () => <DrawerToggleButton tintColor={theme.text} />,
				}}
			/>
			<Stack.Screen
				name="settings"
				options={{ headerTitle: t("nav.settings") }}
			/>
			<Stack.Screen
				name="members"
				options={{ headerTitle: t("nav.members") }}
			/>
			<Stack.Screen
				name="invitations"
				options={{ headerTitle: t("nav.invitations") }}
			/>
			<Stack.Screen name="teams" options={{ headerShown: false }} />
			<Stack.Screen name="roles" options={{ headerTitle: t("nav.roles") }} />
		</Stack>
	);
}
