import { useTranslation } from "@pengana/i18n";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { appDb } from "@/shared/db";
import { useTheme } from "@/shared/lib/theme";
import { destructiveText } from "@/shared/styles/shared";
import migrations from "../../drizzle/migrations";
import {
	OrganizationTodoContent,
	PersonalTodoContent,
	TodoShell,
	type TodoTab,
} from "./todo-content";

export function TodoPage({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const { success, error } = useMigrations(appDb, migrations);
	const { theme } = useTheme();
	const { t } = useTranslation("errors");
	const [activeTab, setActiveTab] = useState<TodoTab>("personal");

	if (error) {
		return (
			<View style={styles.center}>
				<Text style={destructiveText(theme)}>
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
		<View style={styles.page}>
			<ScrollView style={styles.scroll}>
				<TodoShell activeTab={activeTab} onTabChange={setActiveTab} />

				{activeTab === "personal" && (
					<View testID="personal-todo-panel">
						<PersonalTodoContent
							userId={userId}
							organizationId={organizationId}
						/>
					</View>
				)}

				{activeTab === "organization" && (
					<View testID="organization-todo-panel">
						<OrganizationTodoContent
							organizationId={organizationId}
							userId={userId}
						/>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	page: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
});
