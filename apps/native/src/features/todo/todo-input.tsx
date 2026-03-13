import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSync } from "@/features/sync/sync-context";
import {
	PLACEHOLDER_COLORS,
	TEXT_ON_PRIMARY,
} from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";

import { addTodo } from "./todo-actions";

export function TodoInput({ userId }: { userId: string }) {
	const [title, setTitle] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const { triggerSync } = useSync();
	const { theme, colorScheme } = useTheme();
	const { t } = useTranslation();

	const handleSubmit = async () => {
		const trimmed = title.trim();
		if (!trimmed || submitting) return;

		setSubmitting(true);
		try {
			await addTodo(userId, trimmed);
			setTitle("");
			triggerSync();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<View style={styles.container} testID="todo-form">
			<TextInput
				testID="todo-input"
				value={title}
				onChangeText={setTitle}
				placeholder={t("todos:addPlaceholder")}
				accessibilityLabel={t("todos:addPlaceholder")}
				accessibilityHint={t("todos:addInputHint")}
				placeholderTextColor={
					colorScheme === "dark"
						? PLACEHOLDER_COLORS.dark
						: PLACEHOLDER_COLORS.light
				}
				onSubmitEditing={handleSubmit}
				returnKeyType="done"
				style={[
					styles.input,
					{
						color: theme.text,
						borderColor: theme.border,
						backgroundColor: theme.background,
					},
				]}
			/>
			<TouchableOpacity
				testID="todo-submit"
				onPress={handleSubmit}
				disabled={!title.trim() || submitting}
				accessibilityRole="button"
				accessibilityLabel={t("todos:addButton")}
				style={[
					styles.button,
					{
						backgroundColor:
							title.trim() && !submitting ? theme.primary : theme.border,
					},
				]}
			>
				<Text style={styles.buttonText}>{t("todos:addButton")}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		gap: 8,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 14,
	},
	button: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
		justifyContent: "center",
	},
	buttonText: {
		color: TEXT_ON_PRIMARY,
		fontWeight: "600",
		fontSize: 14,
	},
});
