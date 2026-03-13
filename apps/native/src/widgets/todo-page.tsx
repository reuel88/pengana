import { useTranslation } from "@pengana/i18n";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { OrgSyncProvider } from "@/features/sync/org-sync-context";
import { SyncProvider } from "@/features/sync/sync-context";
import { db } from "@/features/todo/entities/todo";
import { STATUS_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
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
	organizationId?: string;
}) {
	const { success, error } = useMigrations(db, migrations);
	const { theme } = useTheme();
	const { t } = useTranslation("errors");
	const [activeTab, setActiveTab] = useState<TodoTab>("personal");

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
		<View style={styles.page}>
			<TodoShell
				activeTab={activeTab}
				onTabChange={setActiveTab}
				showTabs={Boolean(organizationId)}
			/>
			<SyncProvider userId={userId}>
				<View
					testID="personal-todo-panel"
					style={
						activeTab !== "personal" && organizationId
							? styles.hiddenPanel
							: undefined
					}
				>
					<PersonalTodoContent userId={userId} />
				</View>
			</SyncProvider>
			{organizationId ? (
				<OrgSyncProvider organizationId={organizationId} userId={userId}>
					<View
						testID="organization-todo-panel"
						style={
							activeTab !== "organization" ? styles.hiddenPanel : undefined
						}
					>
						<OrganizationTodoContent
							organizationId={organizationId}
							userId={userId}
						/>
					</View>
				</OrgSyncProvider>
			) : null}
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
	hiddenPanel: {
		display: "none",
	},
});
