import { useTranslation } from "@pengana/i18n";
import { Tabs } from "expo-router";
import { useTheme } from "@/shared/lib/theme";
import { TabBarIcon } from "@/shared/ui/tabbar-icon";

export default function TabLayout() {
	const { theme } = useTheme();
	const { t } = useTranslation();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.primary,
				tabBarInactiveTintColor: theme.menuForeground,
				tabBarStyle: {
					backgroundColor: theme.menuBackground,
					borderTopColor: theme.menuBorder,
				},
				tabBarLabelStyle: { fontFamily: theme.fontFamily },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: t("nav.home"),
					tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="explore"
				options={{
					title: t("nav.explore"),
					tabBarIcon: ({ color }) => (
						<TabBarIcon name="compass" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
