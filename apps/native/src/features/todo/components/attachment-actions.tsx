import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { useTheme } from "@/shared/lib/theme";
import { destructiveText, warningText } from "@/shared/styles/shared";

export function AttachButton({ onPress }: { onPress: () => void }) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	return (
		<TouchableOpacity
			onPress={onPress}
			style={styles.attachButton}
			accessibilityRole="button"
			accessibilityLabel={t("actions.attach")}
		>
			<Text style={[styles.attachText, { color: theme.primary }]}>
				{t("actions.attach")}
			</Text>
		</TouchableOpacity>
	);
}

export function RetryButton({ onPress }: { onPress: () => void }) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	return (
		<TouchableOpacity
			onPress={onPress}
			style={styles.attachButton}
			accessibilityRole="button"
			accessibilityLabel={t("actions.retry")}
		>
			<Text style={[styles.retryText, warningText(theme)]}>
				{t("actions.retry")}
			</Text>
		</TouchableOpacity>
	);
}

export function RemoveButton({ onPress }: { onPress: () => void }) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	return (
		<TouchableOpacity
			onPress={onPress}
			style={styles.removeButton}
			accessibilityRole="button"
			accessibilityLabel={t("actions.removeAttachment")}
		>
			<Text style={[styles.removeText, destructiveText(theme)]}>&times;</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	attachButton: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		minHeight: 44,
	},
	attachText: {
		fontSize: 12,
	},
	retryText: {
		fontSize: 12,
	},
	removeButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		minHeight: 28,
	},
	removeText: {
		fontSize: 14,
	},
});
