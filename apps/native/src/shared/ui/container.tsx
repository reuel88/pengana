import type React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/shared/lib/theme";

export function Container({ children }: { children: React.ReactNode }) {
	const { theme } = useTheme();
	const containerStyle = StyleSheet.flatten([
		styles.container,
		{ backgroundColor: theme.background },
	]);

	return <SafeAreaView style={containerStyle}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
