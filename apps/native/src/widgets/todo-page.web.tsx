import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, View } from "react-native";

import { ConnectivityBanner } from "@/features/sync/connectivity-banner";
import { SyncProvider, useSync } from "@/features/sync/sync-context";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import { useTodos } from "@/features/todo/use-todos";
import { useTheme } from "@/lib/theme";

function TodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(userId);
	const { theme } = useTheme();
	const { t } = useTranslation("todos");
	const { isOnline, isSyncing } = useSync();

	return (
		<View style={styles.content}>
			<Text style={[styles.title, { color: theme.text }]}>{t("title")}</Text>
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
			<TodoInput userId={userId} />
			<TodoList todos={todos} />
			<SyncDevtools />
		</View>
	);
}

export function TodoPage({ userId }: { userId: string }) {
	return (
		<SyncProvider userId={userId}>
			<TodoContent userId={userId} />
		</SyncProvider>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		padding: 16,
		gap: 16,
		maxWidth: 512,
		width: "100%",
		alignSelf: "center",
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
	},
});
