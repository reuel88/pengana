import { useTranslation } from "@pengana/i18n";
import type { SyncDescriptor } from "@pengana/sync/runtime";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ConnectivityBanner } from "@/features/sync/connectivity-banner";
import { useSyncEntry } from "@/features/sync/use-sync-entry";
import { SyncDevtools } from "@/features/sync-devtools/sync-devtools";
import {
	addOrgTodo,
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
} from "@/features/todo/org-todo-actions";
import {
	addTodo,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "@/features/todo/todo-actions";
import { TodoInputBase } from "@/features/todo/todo-input-base";
import { TodoList } from "@/features/todo/todo-list";
import type { TodoListActions } from "@/features/todo/todo-list-base";
import { useOrgTodos, useTodos } from "@/features/todo/use-todos";
import { useTheme } from "@/shared/lib/theme";
import { themedText } from "@/shared/styles/shared";

const personalActions: TodoListActions = {
	toggleTodo,
	deleteTodo,
	resolveConflict,
};
const orgActions: TodoListActions = {
	toggleTodo: toggleOrgTodo,
	deleteTodo: deleteOrgTodo,
	resolveConflict: resolveOrgConflict,
};

export type TodoTab = "personal" | "organization";

export function TodoShell({
	activeTab,
	onTabChange,
}: {
	activeTab: TodoTab;
	onTabChange: (tab: TodoTab) => void;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("todos");

	return (
		<View style={styles.content} testID="todo-page">
			<Text
				accessibilityRole="header"
				style={[styles.title, themedText(theme)]}
			>
				{t("title")}
			</Text>

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
						<Text style={[styles.tabText, themedText(theme)]}>{label}</Text>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
}

export function PersonalTodoContent({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const { todos } = useTodos(userId, organizationId);
	const descriptor: SyncDescriptor = useMemo(
		() => ({ scopeType: "personal", scopeId: userId, entityKey: "todo" }),
		[userId],
	);
	const sync = useSyncEntry(descriptor);

	return (
		<View style={styles.panel}>
			<ConnectivityBanner isOnline={sync.isOnline} isSyncing={sync.isSyncing} />
			<TodoInputBase
				onAdd={(title) => addTodo(userId, title, organizationId)}
				triggerSync={sync.triggerSync}
			/>
			<TodoList
				todos={todos}
				syncHook={sync}
				actions={personalActions}
				userId={userId}
				scopeType="personal"
				scopeId={userId}
				organizationId={organizationId}
			/>
			<SyncDevtools descriptor={descriptor} />
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
	const descriptor: SyncDescriptor = useMemo(
		() => ({
			scopeType: "organization",
			scopeId: organizationId,
			entityKey: "todo",
		}),
		[organizationId],
	);
	const sync = useSyncEntry(descriptor);

	return (
		<View style={styles.panel}>
			<ConnectivityBanner isOnline={sync.isOnline} isSyncing={sync.isSyncing} />
			<TodoInputBase
				onAdd={(title) => addOrgTodo(organizationId, userId, title)}
				triggerSync={sync.triggerSync}
			/>
			<TodoList
				todos={todos}
				syncHook={sync}
				actions={orgActions}
				userId={userId}
				scopeType="org"
				scopeId={organizationId}
				organizationId={organizationId}
			/>
			<SyncDevtools descriptor={descriptor} />
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
