import type { TextInputProps } from "react-native";
import { TextInput } from "react-native";
import { useTheme } from "@/lib/theme";
import { sharedStyles } from "@/styles/shared";

export function ThemedTextInput({ style, ...props }: TextInputProps) {
	const { theme } = useTheme();
	return (
		<TextInput
			placeholderTextColor={theme.border}
			{...props}
			style={[
				sharedStyles.input,
				{ color: theme.text, borderColor: theme.border },
				style,
			]}
		/>
	);
}
