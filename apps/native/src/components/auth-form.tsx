import type { ReactNode } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	TouchableOpacity,
	View,
} from "react-native";

import { TEXT_ON_PRIMARY } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";

export function AuthFormCard({
	title,
	error,
	children,
}: {
	title: string;
	error: string | null;
	children: ReactNode;
}) {
	const { theme } = useTheme();
	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.title, { color: theme.text }]}>{title}</Text>
			{error ? (
				<View
					style={[
						styles.errorContainer,
						{ backgroundColor: `${theme.notification}20` },
					]}
				>
					<Text style={[styles.errorText, { color: theme.notification }]}>
						{error}
					</Text>
				</View>
			) : null}
			{children}
		</View>
	);
}

export function AuthFormField({
	value,
	onChangeText,
	onBlur,
	onClearError,
	...rest
}: TextInputProps & { onClearError?: () => void }) {
	const { theme } = useTheme();
	return (
		<TextInput
			style={[
				styles.input,
				{
					color: theme.text,
					borderColor: theme.border,
					backgroundColor: theme.background,
				},
			]}
			placeholderTextColor={theme.text}
			value={value}
			onBlur={onBlur}
			onChangeText={(text) => {
				onChangeText?.(text);
				onClearError?.();
			}}
			{...rest}
		/>
	);
}

export function AuthSubmitButton({
	onPress,
	isSubmitting,
	label,
}: {
	onPress: () => void;
	isSubmitting: boolean;
	label: string;
}) {
	const { theme } = useTheme();
	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={isSubmitting}
			style={[
				styles.button,
				{
					backgroundColor: theme.primary,
					opacity: isSubmitting ? 0.5 : 1,
				},
			]}
		>
			{isSubmitting ? (
				<ActivityIndicator size="small" color={TEXT_ON_PRIMARY} />
			) : (
				<Text style={styles.buttonText}>{label}</Text>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		marginTop: 16,
		padding: 16,
		borderWidth: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	errorContainer: {
		marginBottom: 12,
		padding: 8,
	},
	errorText: {
		fontSize: 14,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 16,
		marginBottom: 12,
	},
	button: {
		padding: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: TEXT_ON_PRIMARY,
		fontSize: 16,
	},
});
