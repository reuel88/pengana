import { useState } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSync } from "@/features/sync/sync-context";
import { useTheme } from "@/lib/theme";

import { addTodo } from "./todo-actions";

export function TodoInput({ userId }: { userId: string }) {
	const [title, setTitle] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const { syncAfterWrite } = useSync();
	const { theme, colorScheme } = useTheme();

	const handleSubmit = async () => {
		const trimmed = title.trim();
		if (!trimmed || submitting) return;

		setSubmitting(true);
		try {
			await addTodo(userId, trimmed);
			setTitle("");
			syncAfterWrite();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<View style={styles.container}>
			<TextInput
				value={title}
				onChangeText={setTitle}
				placeholder="Add a new todo..."
				placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
				onSubmitEditing={handleSubmit}
				returnKeyType="done"
				style={[
					styles.input,
					{
						color: theme.text,
						borderColor: theme.border,
						backgroundColor: theme.background,
					},
				]}
			/>
			<TouchableOpacity
				onPress={handleSubmit}
				disabled={!title.trim() || submitting}
				style={[
					styles.button,
					{
						backgroundColor:
							title.trim() && !submitting ? theme.primary : theme.border,
					},
				]}
			>
				<Text style={styles.buttonText}>Add</Text>
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
		color: "#fff",
		fontWeight: "600",
		fontSize: 14,
	},
});
