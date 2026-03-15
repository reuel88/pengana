import type { TextInputProps } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "@/shared/lib/theme";
import {
	inputThemed,
	placeholderColor,
	themedText,
} from "@/shared/styles/shared";

export function ThemedTextInput({
	style,
	label,
	hint,
	error,
	accessibilityLabel,
	accessibilityHint,
	...props
}: TextInputProps & {
	label?: string;
	hint?: string;
	error?: string;
}) {
	const { theme } = useTheme();
	return (
		<View style={styles.field}>
			{label ? (
				<Text style={[styles.label, themedText(theme)]}>{label}</Text>
			) : null}
			<TextInput
				placeholderTextColor={placeholderColor(theme)}
				accessibilityLabel={accessibilityLabel ?? label}
				accessibilityHint={accessibilityHint ?? hint}
				accessibilityState={{
					disabled: props.editable === false,
				}}
				{...props}
				style={[
					styles.input,
					inputThemed(theme, { isError: Boolean(error), danger: theme.danger }),
					style,
				]}
			/>
			{hint ? (
				<Text style={[styles.hint, { color: theme.mutedText }]}>{hint}</Text>
			) : null}
			{error ? (
				<Text
					style={[styles.error, { color: theme.danger }]}
					accessibilityLiveRegion="polite"
				>
					{error}
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	field: {
		gap: 6,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 14,
	},
	hint: {
		fontSize: 12,
	},
	error: {
		fontSize: 12,
	},
});
