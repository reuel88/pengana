import { useTranslation } from "@pengana/i18n";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { useTheme } from "@/shared/lib/theme";
import { destructiveText, successText } from "@/shared/styles/shared";

import type { AttachmentRow } from "./todo-item";

export function AttachmentIndicator({
	status,
	url,
}: {
	status: AttachmentRow["status"];
	url: string | null;
}) {
	const { t } = useTranslation("todos");
	const { theme } = useTheme();

	if (url && (!status || status === "uploaded")) {
		return (
			<Text style={[styles.attachmentIcon, successText(theme)]} accessible>
				{t("attachment.attached")}
			</Text>
		);
	}
	if (status === "queued" || status === "uploading") {
		return (
			<ActivityIndicator
				size="small"
				accessibilityLabel={t("attachment.uploading")}
			/>
		);
	}
	if (status === "failed") {
		return (
			<Text
				style={[styles.attachmentFailed, destructiveText(theme)]}
				accessible
				accessibilityRole="alert"
			>
				{t("attachment.failed")}
			</Text>
		);
	}
	return null;
}

const styles = StyleSheet.create({
	attachmentIcon: {
		fontSize: 11,
	},
	attachmentFailed: {
		fontSize: 11,
	},
});
