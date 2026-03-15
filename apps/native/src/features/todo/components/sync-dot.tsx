import { useTranslation } from "@pengana/i18n";
import type { Todo } from "@pengana/sync-engine";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/shared/lib/theme";

export function SyncDot({ status }: { status: Todo["syncStatus"] }) {
	const { t } = useTranslation("todos");
	const { theme } = useTheme();

	const labels = {
		synced: t("sync.synced"),
		pending: t("sync.pending"),
		conflict: t("sync.conflict"),
	};
	const dotColors = {
		synced: theme.success,
		pending: theme.warning,
		conflict: theme.danger,
	} as const;

	return (
		<View
			testID="sync-dot"
			style={[styles.syncDot, { backgroundColor: dotColors[status] }]}
			accessibilityLabel={labels[status]}
			accessible
		/>
	);
}

const styles = StyleSheet.create({
	syncDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
});
