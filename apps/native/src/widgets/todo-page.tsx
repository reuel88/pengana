import { useTranslation } from "@pengana/i18n";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SyncProvider } from "@/features/sync/sync-context";
import { db } from "@/features/todo/entities/todo";
import { STATUS_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import migrations from "../../drizzle/migrations";
import { TodoContent } from "./todo-content";

export function TodoPage({ userId }: { userId: string }) {
	const { success, error } = useMigrations(db, migrations);
	const { theme } = useTheme();
	const { t } = useTranslation("errors");

	if (error) {
		return (
			<View style={styles.center}>
				<Text style={{ color: STATUS_COLORS.error }}>
					{t("migrationError", {
						message: String(error.message).slice(0, 200),
					})}
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
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
