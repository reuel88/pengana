import { Stack } from "expo-router";

import { useThemedScreenOptions } from "@/hooks/use-themed-screen-options";

export default function TeamsLayout() {
	const screenOptions = useThemedScreenOptions();

	return <Stack screenOptions={screenOptions} />;
}
