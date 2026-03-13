import type { TextInputProps } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { PLACEHOLDER_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { sharedStyles } from "@/shared/styles/shared";

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
	const { theme, colorScheme } = useTheme();
	return (
		<View style={styles.field}>
			{label ? (
				<Text style={[styles.label, { color: theme.text }]}>{label}</Text>
			) : null}
			<TextInput
				placeholderTextColor={
					colorScheme === "dark"
						? PLACEHOLDER_COLORS.dark
						: PLACEHOLDER_COLORS.light
				}
				accessibilityLabel={accessibilityLabel ?? label}
				accessibilityHint={accessibilityHint ?? hint}
				accessibilityState={{
					disabled: props.editable === false,
				}}
				{...props}
				style={[
					sharedStyles.input,
					{
						color: theme.text,
						borderColor: error ? theme.notification : theme.border,
					},
					style,
				]}
			/>
			{hint ? (
				<Text style={[styles.hint, { color: theme.text }]}>{hint}</Text>
			) : null}
			{error ? (
				<Text
					style={[styles.error, { color: theme.notification }]}
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
	hint: {
		fontSize: 12,
		opacity: 0.7,
	},
	error: {
		fontSize: 12,
	},
});
