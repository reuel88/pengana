import type { Todo } from "@pengana/sync-engine";
import { StyleSheet, View } from "react-native";

import { SYNC_STATUS_COLORS, SYNC_STATUS_LABELS } from "@/lib/design-tokens";

export function SyncDot({ status }: { status: Todo["syncStatus"] }) {
	return (
		<View
			style={[styles.syncDot, { backgroundColor: SYNC_STATUS_COLORS[status] }]}
			accessibilityLabel={SYNC_STATUS_LABELS[status]}
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
