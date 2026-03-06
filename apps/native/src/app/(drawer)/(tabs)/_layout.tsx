import { useTranslation } from "@pengana/i18n";
import { Tabs } from "expo-router";

import { TabBarIcon } from "@/components/tabbar-icon";
import { useTheme } from "@/lib/theme";

export default function TabLayout() {
	const { theme } = useTheme();
	const { t } = useTranslation();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.primary,
				tabBarInactiveTintColor: theme.text,
				tabBarStyle: {
					backgroundColor: theme.background,
					borderTopColor: theme.border,
				},
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
				name="two"
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
