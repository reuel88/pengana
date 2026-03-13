import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ConnectivityBanner } from "@/features/sync/connectivity-banner";
import { useOrgSync } from "@/features/sync/org-sync-context";
import { useSync } from "@/features/sync/sync-context";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import { OrgTodoInput } from "@/features/todo/org-todo-input";
import { OrgTodoList } from "@/features/todo/org-todo-list";
import { TodoInput } from "@/features/todo/todo-input";
import { TodoList } from "@/features/todo/todo-list";
import { useOrgTodos, useTodos } from "@/features/todo/use-todos";
import { useTheme } from "@/shared/lib/theme";

export type TodoTab = "personal" | "organization";

export function TodoShell({
	activeTab,
	onTabChange,
	showTabs,
}: {
	activeTab: TodoTab;
	onTabChange: (tab: TodoTab) => void;
	showTabs: boolean;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	return (
		<View style={styles.content} testID="todo-page">
			<Text
				accessibilityRole="header"
				style={[styles.title, { color: theme.text }]}
			>
				{t("title")}
			</Text>
			{showTabs ? (
				<View
					accessibilityRole="tablist"
					style={[styles.tabList, { borderBottomColor: theme.border }]}
				>
					{(
						[
							{ key: "personal", label: t("tabs.personal") },
							{ key: "organization", label: t("tabs.organization") },
						] as const
					).map(({ key, label }) => (
						<TouchableOpacity
							key={key}
							accessibilityRole="tab"
							accessibilityState={{ selected: activeTab === key }}
							onPress={() => onTabChange(key)}
							testID={`todo-tab-${key}`}
							style={[
								styles.tabButton,
								{
									borderBottomColor:
										activeTab === key ? theme.text : "transparent",
									opacity: activeTab === key ? 1 : 0.6,
								},
							]}
						>
							<Text style={[styles.tabText, { color: theme.text }]}>
								{label}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			) : null}
		</View>
	);
}

export function PersonalTodoContent({ userId }: { userId: string }) {
	const { todos } = useTodos(userId);
	const { isOnline, isSyncing } = useSync();

	return (
		<View style={styles.panel}>
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
			<TodoInput userId={userId} />
			<TodoList todos={todos} />
			<SyncDevtools />
		</View>
	);
}

export function OrganizationTodoContent({
	organizationId,
	userId,
}: {
	organizationId: string;
	userId: string;
}) {
	const { todos } = useOrgTodos(organizationId);
	const { isOnline, isSyncing } = useOrgSync();

	return (
		<View style={styles.panel}>
			<ConnectivityBanner isOnline={isOnline} isSyncing={isSyncing} />
			<OrgTodoInput organizationId={organizationId} userId={userId} />
			<OrgTodoList todos={todos} />
			<SyncDevtools />
		</View>
	);
}

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: 16,
		paddingTop: 16,
		gap: 16,
		maxWidth: 512,
		width: "100%",
		alignSelf: "center",
	},
	panel: {
		paddingHorizontal: 16,
		paddingBottom: 16,
		gap: 16,
		maxWidth: 512,
		width: "100%",
		alignSelf: "center",
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
	},
	tabList: {
		flexDirection: "row",
		gap: 8,
		borderBottomWidth: 1,
	},
	tabButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderBottomWidth: 2,
	},
	tabText: {
		fontSize: 14,
		fontWeight: "500",
	},
});
