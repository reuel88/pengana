import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";

import { HeaderButton } from "@/components/header-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTheme } from "@/lib/theme";

const DrawerLayout = () => {
	const { theme } = useTheme();
	const { t } = useTranslation();

	return (
		<Drawer
			screenOptions={{
				headerStyle: {
					backgroundColor: theme.background,
				},
				headerTitleStyle: {
					color: theme.text,
				},
				headerTintColor: theme.text,
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
				name="(tabs)"
				options={{
					headerTitle: t("nav.tabs"),
					drawerLabel: t("nav.tabs"),
					drawerIcon: ({ size, color }) => (
						<MaterialIcons name="border-bottom" size={size} color={color} />
					),
					headerRight: () => (
						<Link href="/modal" asChild>
							<HeaderButton />
						</Link>
					),
				}}
			/>
		</Drawer>
	);
};

export default DrawerLayout;
