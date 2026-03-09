import { StyleSheet } from "react-native";

/** Static styles shared across org/form screens */
export const sharedStyles = StyleSheet.create({
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	button: { padding: 12, alignItems: "center" },
	buttonText: { color: "#fff", fontWeight: "bold" },
	smallButtonText: { color: "#fff", fontSize: 12 },
	listContainer: { padding: 16, gap: 8 },
});

/** Theme-dependent style factories */
export function mutedText(theme: { text: string }) {
	return { color: theme.text, opacity: 0.5 } as const;
}

export function primaryText(theme: { text: string }) {
	return { color: theme.text } as const;
}

export function secondaryText(theme: { text: string }) {
	return { color: theme.text, opacity: 0.7, fontSize: 12 } as const;
}

export function inputThemed(theme: { text: string; border: string }) {
	return { color: theme.text, borderColor: theme.border } as const;
}
