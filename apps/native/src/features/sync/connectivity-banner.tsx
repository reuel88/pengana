import { StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/lib/use-color-scheme";

import { useSync } from "./sync-context";

export function ConnectivityBanner() {
	const { isOnline, isSyncing } = useSync();
	const { colorScheme } = useColorScheme();

	const backgroundColor = isOnline
		? "rgba(34, 197, 94, 0.1)"
		: "rgba(239, 68, 68, 0.1)";
	const textColor = isOnline
		? colorScheme === "dark"
			? "#4ade80"
			: "#16a34a"
		: colorScheme === "dark"
			? "#f87171"
			: "#dc2626";

	return (
		<View style={[styles.banner, { backgroundColor }]}>
			<Text style={[styles.text, { color: textColor }]}>
				{isOnline
					? isSyncing
						? "Syncing..."
						: "Online"
					: "Offline - changes saved locally"}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	banner: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		alignItems: "center",
	},
	text: {
		fontSize: 12,
		fontWeight: "500",
	},
});
