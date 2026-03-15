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

import { useTheme } from "@/shared/lib/theme";
import {
	inputThemed,
	placeholderColor,
	primaryButton,
	primaryButtonText,
	themedSurface,
	themedText,
} from "@/shared/styles/shared";

export function AuthFormCard({
	title,
	error,
	children,
	testID,
}: {
	title: string;
	error?: string | null;
	children: ReactNode;
	testID?: string;
}) {
	const { theme } = useTheme();

	return (
		<View testID={testID} style={[styles.card, themedSurface(theme)]}>
			<Text style={[styles.title, themedText(theme)]}>{title}</Text>
			{error ? (
				<View
					testID="auth-error"
					style={[
						styles.errorContainer,
						{
							backgroundColor: theme.dangerSurface,
							borderColor: theme.danger,
						},
					]}
				>
					<Text style={[styles.errorText, { color: theme.danger }]}>
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
	label,
	hint,
	accessibilityLabel,
	accessibilityHint,
	...rest
}: TextInputProps & {
	onClearError?: () => void;
	errors?: Array<{ message: string }> | undefined;
	label: string;
	hint?: string;
}) {
	const { theme } = useTheme();
	const hasErrors = errors != null && errors.length > 0;
	return (
		<View style={styles.fieldContainer}>
			<Text style={[styles.label, themedText(theme)]}>{label}</Text>
			<TextInput
				testID={testID}
				style={[
					styles.input,
					inputThemed(theme, { isError: hasErrors, danger: theme.danger }),
				]}
				placeholderTextColor={placeholderColor(theme)}
				value={value}
				onBlur={onBlur}
				{...rest}
				accessibilityLabel={accessibilityLabel ?? label}
				accessibilityHint={accessibilityHint ?? hint}
				accessibilityState={{
					disabled: rest.editable === false,
				}}
				onChangeText={(text) => {
					onChangeText?.(text);
					onClearError?.();
				}}
			/>
			{hint ? (
				<Text style={[styles.hintText, { color: theme.mutedText }]}>
					{hint}
				</Text>
			) : null}
			{hasErrors
				? errors.map((err, index) => (
						<Text
							key={`${err.message}-${String(index)}`}
							style={[styles.fieldErrorText, { color: theme.danger }]}
							accessibilityLiveRegion="polite"
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
	disabled = false,
	label,
	testID,
}: {
	onPress: () => void;
	isSubmitting: boolean;
	disabled?: boolean;
	label: string;
	testID?: string;
}) {
	const { theme } = useTheme();
	const isDisabled = isSubmitting || disabled;
	return (
		<TouchableOpacity
			testID={testID}
			onPress={onPress}
			disabled={isDisabled}
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: isDisabled, busy: isSubmitting }}
			style={[styles.button, primaryButton(theme, { disabled: isDisabled })]}
		>
			{isSubmitting ? (
				<ActivityIndicator size="small" color={theme.primaryForeground} />
			) : (
				<Text style={[styles.buttonText, primaryButtonText(theme)]}>
					{label}
				</Text>
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
	label: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 6,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 16,
	},
	hintText: {
		fontSize: 12,
		marginTop: 4,
		opacity: 0.7,
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
		fontSize: 16,
	},
});
