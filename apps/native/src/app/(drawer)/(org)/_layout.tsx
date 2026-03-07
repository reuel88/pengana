import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@pengana/i18n";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { Redirect, Stack } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

export default function OrgLayout() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { data: session } = authClient.useSession();

	if (!session) {
		return <Redirect href="/" />;
	}

	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: theme.background },
				headerTitleStyle: { color: theme.text },
				headerTintColor: theme.text,
			}}
		>
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
			<Stack.Screen name="teams" options={{ headerTitle: t("nav.teams") }} />
			<Stack.Screen name="roles" options={{ headerTitle: t("nav.roles") }} />
		</Stack>
	);
}
