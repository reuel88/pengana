import { useTranslation } from "@pengana/i18n";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { db } from "@/entities/todo";
import { ConnectivityBanner } from "@/features/sync/connectivity-banner";
import { SyncProvider } from "@/features/sync/sync-context";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import { useTodos } from "@/features/todo/use-todos";
import { STATUS_COLORS } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";
import migrations from "../../drizzle/migrations";

function TodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(userId);
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	return (
		<View style={styles.content}>
			<Text style={[styles.title, { color: theme.text }]}>{t("title")}</Text>
			<ConnectivityBanner />
			<TodoInput userId={userId} />
			<TodoList todos={todos} />
			<SyncDevtools />
		</View>
	);
}

export function TodoPage({ userId }: { userId: string }) {
	const { success, error } = useMigrations(db, migrations);
	const { theme } = useTheme();

	if (error) {
		return (
			<View style={styles.center}>
				<Text style={{ color: STATUS_COLORS.error }}>
					Migration error: {error.message}. Try restarting the app.
				</Text>
			</View>
		);
	}

	if (!success) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color={theme.primary} />
			</View>
		);
	}

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
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
