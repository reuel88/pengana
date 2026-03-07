import { Stack } from "expo-router";

import { useTheme } from "@/lib/theme";

export default function TeamsLayout() {
	const { theme } = useTheme();

	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: theme.background },
				headerTitleStyle: { color: theme.text },
				headerTintColor: theme.text,
			}}
		/>
	);
}
