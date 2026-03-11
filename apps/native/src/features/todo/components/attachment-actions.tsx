import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { STATUS_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";

export function AttachButton({ onPress }: { onPress: () => void }) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	return (
		<TouchableOpacity onPress={onPress} style={styles.attachButton}>
			<Text style={[styles.attachText, { color: theme.primary }]}>
				{t("actions.attach")}
			</Text>
		</TouchableOpacity>
	);
}

export function RetryButton({ onPress }: { onPress: () => void }) {
	const { t } = useTranslation("todos");

	return (
		<TouchableOpacity onPress={onPress} style={styles.attachButton}>
			<Text style={styles.retryText}>{t("actions.retry")}</Text>
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
		color: STATUS_COLORS.warning,
	},
});
