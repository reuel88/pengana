import { useTranslation } from "@pengana/i18n";
import type { Todo } from "@pengana/sync-engine";
import { StyleSheet, View } from "react-native";

import { SYNC_STATUS_COLORS } from "@/shared/lib/design-tokens";

export function SyncDot({ status }: { status: Todo["syncStatus"] }) {
	const { t } = useTranslation("todos");

	const labels = {
		synced: t("sync.synced"),
		pending: t("sync.pending"),
		conflict: t("sync.conflict"),
	};

	return (
		<View
			testID="sync-dot"
			style={[styles.syncDot, { backgroundColor: SYNC_STATUS_COLORS[status] }]}
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
