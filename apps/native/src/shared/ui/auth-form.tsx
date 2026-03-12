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

import {
	BANNER_COLORS,
	STATUS_COLORS,
	TEXT_ON_PRIMARY,
} from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";

export function AuthFormCard({
	title,
	error,
	children,
	testID,
}: {
	title: string;
	error: string | null;
	children: ReactNode;
	testID?: string;
}) {
	const { theme, colorScheme } = useTheme();
	const errorTextColor =
		colorScheme === "dark"
			? BANNER_COLORS.offlineTextDark
			: BANNER_COLORS.offlineTextLight;

	return (
		<View
			testID={testID}
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.title, { color: theme.text }]}>{title}</Text>
			{error ? (
				<View
					testID="auth-error"
					style={[
						styles.errorContainer,
						{
							backgroundColor: BANNER_COLORS.offlineBg,
							borderColor: STATUS_COLORS.error,
						},
					]}
				>
					<Text style={[styles.errorText, { color: errorTextColor }]}>
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
	errors,
	testID,
	...rest
}: TextInputProps & {
	onClearError?: () => void;
	errors?: Array<{ message: string }> | undefined;
}) {
	const { theme } = useTheme();
	const hasErrors = errors != null && errors.length > 0;
	return (
		<View style={styles.fieldContainer}>
			<TextInput
				testID={testID}
				style={[
					styles.input,
					{
						color: theme.text,
						borderColor: hasErrors ? theme.notification : theme.border,
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
			{hasErrors
				? errors.map((err) => (
						<Text
							key={err.message}
							style={[styles.fieldErrorText, { color: theme.notification }]}
						>
							{err.message}
						</Text>
					))
				: null}
		</View>
	);
}

export function AuthSubmitButton({
	onPress,
	isSubmitting,
	label,
	testID,
}: {
	onPress: () => void;
	isSubmitting: boolean;
	label: string;
	testID?: string;
}) {
	const { theme } = useTheme();
	return (
		<TouchableOpacity
			testID={testID}
			onPress={onPress}
			disabled={isSubmitting}
			accessibilityRole="button"
			accessibilityLabel={label}
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
		borderWidth: 1,
	},
	errorText: {
		fontSize: 14,
		lineHeight: 20,
	},
	fieldContainer: {
		marginBottom: 12,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 16,
	},
	fieldErrorText: {
		fontSize: 12,
		marginTop: 4,
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
