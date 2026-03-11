import { Stack } from "expo-router";

import { useThemedScreenOptions } from "@/shared/hooks/use-themed-screen-options";

export default function TeamsLayout() {
	const screenOptions = useThemedScreenOptions();

	return <Stack screenOptions={screenOptions} />;
}
