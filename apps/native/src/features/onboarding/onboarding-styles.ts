import { StyleSheet } from "react-native";
import { TEXT_ON_PRIMARY } from "@/shared/lib/design-tokens";

export const onboardingStyles = StyleSheet.create({
	card: {
		padding: 16,
		borderWidth: 1,
		width: "100%",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	description: {
		fontSize: 14,
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 4,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 16,
		marginBottom: 12,
	},
	submitButton: {
		padding: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	submitButtonText: {
		color: TEXT_ON_PRIMARY,
		fontSize: 16,
		fontWeight: "500",
	},
	ghostButton: {
		padding: 12,
		alignItems: "center",
		marginTop: 8,
	},
	ghostButtonText: {
		fontSize: 14,
	},
});
