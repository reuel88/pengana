import { useTranslation } from "@pengana/i18n";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { Stack } from "expo-router";
import { useThemedScreenOptions } from "@/shared/hooks/use-themed-screen-options";
import { useTheme } from "@/shared/lib/theme";

export default function SettingsLayout() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const screenOptions = useThemedScreenOptions();

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: t("auth:settings.account.title"),
					headerLeft: () => (
						<DrawerToggleButton tintColor={theme.menuForeground} />
					),
				}}
			/>
			<Stack.Screen
				name="account"
				options={{ headerTitle: t("auth:settings.nav.account") }}
			/>
			<Stack.Screen
				name="sessions"
				options={{ headerTitle: t("auth:settings.nav.sessions") }}
			/>
			<Stack.Screen
				name="delete-account"
				options={{ headerTitle: t("auth:settings.nav.deleteAccount") }}
			/>
		</Stack>
	);
}
