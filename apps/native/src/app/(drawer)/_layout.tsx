import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { LanguageSwitcher } from "@/features/i18n/language-switcher";
import { useThemedScreenOptions } from "@/shared/hooks/use-themed-screen-options";
import { useTheme } from "@/shared/lib/theme";
import { HeaderButton } from "@/shared/ui/header-button";

const DrawerLayout = () => {
	const { theme } = useTheme();
	const { t } = useTranslation();
	const screenOptions = useThemedScreenOptions();

	return (
		<Drawer
			screenOptions={{
				...screenOptions,
				headerRight: () => <LanguageSwitcher />,
				drawerStyle: {
					backgroundColor: theme.background,
				},
				drawerLabelStyle: {
					color: theme.text,
				},
				drawerInactiveTintColor: theme.text,
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: t("nav.home"),
					drawerLabel: t("nav.home"),
					drawerIcon: ({ size, color }) => (
						<Ionicons name="home-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="todos"
				options={{
					headerTitle: t("nav.todos"),
					drawerLabel: t("nav.todos"),
					drawerIcon: ({ size, color }) => (
						<Ionicons name="checkbox-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="(org)"
				options={{
					headerTitle: t("organization:title"),
					drawerLabel: t("organization:title"),
					drawerIcon: ({ size, color }) => (
						<Ionicons name="people-outline" size={size} color={color} />
					),
					headerShown: false,
				}}
			/>
			<Drawer.Screen
				name="settings"
				options={{
					headerTitle: t("auth:settings.account.title"),
					drawerLabel: t("common:user.settings"),
					drawerIcon: ({ size, color }) => (
						<Ionicons name="settings-outline" size={size} color={color} />
					),
					headerShown: false,
				}}
			/>
			<Drawer.Screen
				name="(tabs)"
				options={{
					headerTitle: t("nav.tabs"),
					drawerLabel: t("nav.tabs"),
					drawerIcon: ({ size, color }) => (
						<MaterialIcons name="border-bottom" size={size} color={color} />
					),
					headerRight: () => (
						<Link href="/modal" asChild>
							<HeaderButton accessibilityLabel={t("common:modalOpen")} />
						</Link>
					),
				}}
			/>
		</Drawer>
	);
};

export default DrawerLayout;
