import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/lib/theme";

export function ConflictActions({
	onResolve,
}: {
	onResolve: (resolution: "local" | "server") => void;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	return (
		<View style={styles.conflictButtons}>
			<TouchableOpacity
				style={[styles.smallButton, { borderColor: theme.border }]}
				onPress={() => onResolve("local")}
			>
				<Text style={[styles.smallButtonText, { color: theme.text }]}>
					{t("actions.keepLocal")}
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.smallButton, { borderColor: theme.border }]}
				onPress={() => onResolve("server")}
			>
				<Text style={[styles.smallButtonText, { color: theme.text }]}>
					{t("actions.useServer")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	conflictButtons: {
		flexDirection: "row",
		gap: 4,
	},
	smallButton: {
		borderWidth: 1,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	smallButtonText: {
		fontSize: 11,
	},
});
