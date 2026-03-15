import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useTheme } from "@/shared/lib/theme";
import {
	inputThemed,
	placeholderColor,
	primaryButtonText,
	themedControl,
} from "@/shared/styles/shared";

export function TodoInputBase({
	onAdd,
	triggerSync,
}: {
	onAdd: (title: string) => Promise<void>;
	triggerSync: () => void;
}) {
	const [title, setTitle] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const { theme } = useTheme();
	const { t } = useTranslation();

	const handleSubmit = async () => {
		const trimmed = title.trim();
		if (!trimmed || submitting) return;

		setSubmitting(true);
		try {
			await onAdd(trimmed);
			setTitle("");
			triggerSync();
		} catch {
			Alert.alert(t("common:error.title"), t("errors:failedToAddTodo"));
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
				placeholderTextColor={placeholderColor(theme)}
				onSubmitEditing={handleSubmit}
				returnKeyType="done"
				style={[styles.input, themedControl(theme), inputThemed(theme)]}
			/>
			<TouchableOpacity
				testID="todo-submit"
				onPress={handleSubmit}
				disabled={!title.trim() || submitting}
				accessibilityRole="button"
				accessibilityLabel={t("todos:addButton")}
				style={[
					styles.button,
					{ borderRadius: theme.radius },
					{
						backgroundColor:
							title.trim() && !submitting ? theme.primary : theme.border,
					},
				]}
			>
				<Text style={[styles.buttonText, primaryButtonText(theme)]}>
					{t("todos:addButton")}
				</Text>
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
		fontSize: 14,
	},
});
