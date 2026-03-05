import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/lib/theme";

import type { TodoItemRow } from "./components/todo-item";
import { TodoItem } from "./components/todo-item";

export type { TodoItemRow };

export function TodoList({ todos }: { todos: TodoItemRow[] }) {
	const { theme } = useTheme();

	if (todos.length === 0) {
		return (
			<Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>
				No todos yet
			</Text>
		);
	}

	return (
		<View style={[styles.list, { borderColor: theme.border }]}>
			{todos.map((todo) => (
				<TodoItem key={todo.id} todo={todo} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	list: {
		borderWidth: 1,
		borderRadius: 0,
	},
	emptyText: {
		textAlign: "center",
		paddingVertical: 16,
		fontSize: 14,
	},
});
