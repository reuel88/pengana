import { useTranslation } from "@pengana/i18n";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { STATUS_COLORS } from "@/lib/design-tokens";

import type { TodoItemRow } from "./todo-item";

export function AttachmentIndicator({
	status,
	attachmentUrl,
}: {
	status: TodoItemRow["attachmentStatus"];
	attachmentUrl: string | null;
}) {
	const { t } = useTranslation("todos");

	if (attachmentUrl && (!status || status === "uploaded")) {
		return (
			<Text style={styles.attachmentIcon}>{t("attachment.attached")}</Text>
		);
	}
	if (status === "queued" || status === "uploading") {
		return <ActivityIndicator size="small" />;
	}
	if (status === "failed") {
		return (
			<Text style={styles.attachmentFailed}>{t("attachment.failed")}</Text>
		);
	}
	return null;
}

const styles = StyleSheet.create({
	attachmentIcon: {
		fontSize: 11,
		color: STATUS_COLORS.success,
	},
	attachmentFailed: {
		fontSize: 11,
		color: STATUS_COLORS.error,
	},
});
