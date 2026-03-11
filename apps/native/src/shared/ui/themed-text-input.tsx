import type { TextInputProps } from "react-native";
import { TextInput } from "react-native";
import { PLACEHOLDER_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { sharedStyles } from "@/shared/styles/shared";

export function ThemedTextInput({ style, ...props }: TextInputProps) {
	const { theme, colorScheme } = useTheme();
	return (
		<TextInput
			placeholderTextColor={
				colorScheme === "dark"
					? PLACEHOLDER_COLORS.dark
					: PLACEHOLDER_COLORS.light
			}
			{...props}
			style={[
				sharedStyles.input,
				{ color: theme.text, borderColor: theme.border },
				style,
			]}
		/>
	);
}
