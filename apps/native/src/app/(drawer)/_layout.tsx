import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { LanguageSwitcher } from "@/features/i18n/language-switcher";
import { useThemedScreenOptions } from "@/shared/hooks/use-themed-screen-options";
import { useTheme } from "@/shared/lib/theme";
import { AppIcon } from "@/shared/ui/app-icon";
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
					backgroundColor: theme.menuBackground,
				},
				drawerLabelStyle: {
					color: theme.menuForeground,
					fontFamily: theme.fontFamily,
				},
				drawerInactiveTintColor: theme.menuForeground,
				drawerActiveTintColor: theme.primary,
				drawerActiveBackgroundColor: `${theme.primary}20`,
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: t("nav.home"),
					drawerLabel: t("nav.home"),
					drawerIcon: ({ size, color }) => (
						<AppIcon name="home" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="todos"
				options={{
					headerTitle: t("nav.todos"),
					drawerLabel: t("nav.todos"),
					drawerIcon: ({ size, color }) => (
						<AppIcon name="todo" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="(org)"
				options={{
					headerTitle: t("organization:title"),
					drawerLabel: t("organization:title"),
					drawerIcon: ({ size, color }) => (
						<AppIcon name="org" size={size} color={color} />
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
						<AppIcon name="settings" size={size} color={color} />
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
						<AppIcon name="layout" size={size} color={color} />
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
