import {
	Feather,
	FontAwesome,
	Ionicons,
	MaterialCommunityIcons,
	MaterialIcons,
} from "@expo/vector-icons";
import type { AppIconName, OrgIconLibraryId } from "@pengana/org-client";
import type { ComponentProps, ComponentType } from "react";
import { useTheme } from "@/shared/lib/theme";

type NativeIconRenderer = ComponentType<{
	name: string;
	size: number;
	color: string;
	style?: ComponentProps<typeof Feather>["style"];
}>;

type IconProps = {
	name: AppIconName;
	size: number;
	color: string;
	style?: ComponentProps<typeof Feather>["style"];
};

const iconNameMap = {
	lucide: {
		alert: { family: Feather, name: "alert-circle" },
		bell: { family: Feather, name: "bell" },
		check: { family: Feather, name: "check" },
		"chevron-down": { family: Feather, name: "chevron-down" },
		"chevron-left": { family: Feather, name: "chevron-left" },
		"chevron-right": { family: Feather, name: "chevron-right" },
		"chevron-up": { family: Feather, name: "chevron-up" },
		close: { family: Feather, name: "x" },
		compass: { family: Feather, name: "compass" },
		globe: { family: Feather, name: "globe" },
		home: { family: Feather, name: "home" },
		info: { family: Feather, name: "info" },
		layout: { family: Feather, name: "layout" },
		loader: { family: Feather, name: "loader" },
		mail: { family: Feather, name: "mail" },
		"menu-panel-left": { family: Feather, name: "sidebar" },
		minus: { family: Feather, name: "minus" },
		moon: { family: Feather, name: "moon" },
		"more-horizontal": { family: Feather, name: "more-horizontal" },
		org: { family: Feather, name: "users" },
		pencil: { family: Feather, name: "edit-2" },
		plus: { family: Feather, name: "plus" },
		search: { family: Feather, name: "search" },
		settings: { family: Feather, name: "settings" },
		sun: { family: Feather, name: "sun" },
		todo: { family: Feather, name: "check-square" },
	},
	tabler: {
		alert: { family: MaterialIcons, name: "error-outline" },
		bell: { family: MaterialCommunityIcons, name: "bell-outline" },
		check: { family: MaterialIcons, name: "check" },
		"chevron-down": { family: MaterialIcons, name: "keyboard-arrow-down" },
		"chevron-left": { family: MaterialIcons, name: "keyboard-arrow-left" },
		"chevron-right": { family: MaterialIcons, name: "keyboard-arrow-right" },
		"chevron-up": { family: MaterialIcons, name: "keyboard-arrow-up" },
		close: { family: MaterialIcons, name: "close" },
		compass: { family: MaterialCommunityIcons, name: "compass-outline" },
		globe: { family: MaterialIcons, name: "public" },
		home: { family: MaterialIcons, name: "home-filled" },
		info: { family: MaterialIcons, name: "info-outline" },
		layout: { family: MaterialCommunityIcons, name: "view-dashboard-outline" },
		loader: { family: MaterialIcons, name: "autorenew" },
		mail: { family: MaterialIcons, name: "mail-outline" },
		"menu-panel-left": { family: MaterialCommunityIcons, name: "dock-left" },
		minus: { family: MaterialIcons, name: "remove" },
		moon: { family: MaterialCommunityIcons, name: "moon-waning-crescent" },
		"more-horizontal": { family: MaterialIcons, name: "more-horiz" },
		org: { family: MaterialIcons, name: "groups" },
		pencil: { family: MaterialIcons, name: "edit" },
		plus: { family: MaterialIcons, name: "add" },
		search: { family: MaterialIcons, name: "search" },
		settings: { family: MaterialIcons, name: "settings" },
		sun: { family: MaterialCommunityIcons, name: "white-balance-sunny" },
		todo: { family: MaterialIcons, name: "check-box" },
	},
	phosphor: {
		alert: { family: FontAwesome, name: "warning" },
		bell: { family: FontAwesome, name: "bell-o" },
		check: { family: FontAwesome, name: "check" },
		"chevron-down": { family: FontAwesome, name: "angle-down" },
		"chevron-left": { family: FontAwesome, name: "angle-left" },
		"chevron-right": { family: FontAwesome, name: "angle-right" },
		"chevron-up": { family: FontAwesome, name: "angle-up" },
		close: { family: FontAwesome, name: "close" },
		compass: { family: FontAwesome, name: "compass" },
		globe: { family: FontAwesome, name: "globe" },
		home: { family: FontAwesome, name: "home" },
		info: { family: FontAwesome, name: "info-circle" },
		layout: { family: FontAwesome, name: "th-large" },
		loader: { family: FontAwesome, name: "spinner" },
		mail: { family: FontAwesome, name: "envelope-o" },
		"menu-panel-left": { family: FontAwesome, name: "columns" },
		minus: { family: FontAwesome, name: "minus" },
		moon: { family: FontAwesome, name: "moon-o" },
		"more-horizontal": { family: FontAwesome, name: "ellipsis-h" },
		org: { family: FontAwesome, name: "users" },
		pencil: { family: FontAwesome, name: "pencil" },
		plus: { family: FontAwesome, name: "plus" },
		search: { family: FontAwesome, name: "search" },
		settings: { family: FontAwesome, name: "gear" },
		sun: { family: FontAwesome, name: "sun-o" },
		todo: { family: FontAwesome, name: "check-square-o" },
	},
	remixicon: {
		alert: { family: Ionicons, name: "alert-circle-outline" },
		bell: { family: Ionicons, name: "notifications-outline" },
		check: { family: Ionicons, name: "checkmark" },
		"chevron-down": { family: Ionicons, name: "chevron-down" },
		"chevron-left": { family: Ionicons, name: "chevron-back" },
		"chevron-right": { family: Ionicons, name: "chevron-forward" },
		"chevron-up": { family: Ionicons, name: "chevron-up" },
		close: { family: Ionicons, name: "close" },
		compass: { family: Ionicons, name: "compass-outline" },
		globe: { family: Ionicons, name: "globe-outline" },
		home: { family: Ionicons, name: "home-outline" },
		info: { family: Ionicons, name: "information-circle-outline" },
		layout: { family: Ionicons, name: "grid-outline" },
		loader: { family: Ionicons, name: "reload" },
		mail: { family: Ionicons, name: "mail-outline" },
		"menu-panel-left": { family: Ionicons, name: "menu-outline" },
		minus: { family: Ionicons, name: "remove" },
		moon: { family: Ionicons, name: "moon-outline" },
		"more-horizontal": { family: Ionicons, name: "ellipsis-horizontal" },
		org: { family: Ionicons, name: "people-outline" },
		pencil: { family: Ionicons, name: "create-outline" },
		plus: { family: Ionicons, name: "add" },
		search: { family: Ionicons, name: "search-outline" },
		settings: { family: Ionicons, name: "settings-outline" },
		sun: { family: Ionicons, name: "sunny-outline" },
		todo: { family: Ionicons, name: "checkbox-outline" },
	},
	hugeicons: {
		alert: { family: MaterialCommunityIcons, name: "alert-circle-outline" },
		bell: { family: MaterialCommunityIcons, name: "bell-outline" },
		check: { family: MaterialCommunityIcons, name: "check" },
		"chevron-down": { family: MaterialCommunityIcons, name: "chevron-down" },
		"chevron-left": { family: MaterialCommunityIcons, name: "chevron-left" },
		"chevron-right": { family: MaterialCommunityIcons, name: "chevron-right" },
		"chevron-up": { family: MaterialCommunityIcons, name: "chevron-up" },
		close: { family: MaterialCommunityIcons, name: "close" },
		compass: { family: MaterialCommunityIcons, name: "compass-outline" },
		globe: { family: MaterialCommunityIcons, name: "earth" },
		home: { family: MaterialCommunityIcons, name: "home-outline" },
		info: { family: MaterialCommunityIcons, name: "information-outline" },
		layout: { family: MaterialCommunityIcons, name: "view-dashboard-outline" },
		loader: { family: MaterialCommunityIcons, name: "loading" },
		mail: { family: MaterialCommunityIcons, name: "email-outline" },
		"menu-panel-left": { family: MaterialCommunityIcons, name: "dock-left" },
		minus: { family: MaterialCommunityIcons, name: "minus" },
		moon: { family: MaterialCommunityIcons, name: "moon-waning-crescent" },
		"more-horizontal": {
			family: MaterialCommunityIcons,
			name: "dots-horizontal",
		},
		org: { family: MaterialCommunityIcons, name: "account-group-outline" },
		pencil: { family: MaterialCommunityIcons, name: "pencil-outline" },
		plus: { family: MaterialCommunityIcons, name: "plus" },
		search: { family: MaterialCommunityIcons, name: "magnify" },
		settings: { family: MaterialCommunityIcons, name: "cog-outline" },
		sun: { family: MaterialCommunityIcons, name: "white-balance-sunny" },
		todo: { family: MaterialCommunityIcons, name: "checkbox-blank-outline" },
	},
} as const;

const fallbackIconMap = {
	alert: { family: Feather, name: "alert-circle" },
	bell: { family: Feather, name: "bell" },
	check: { family: Feather, name: "check" },
	"chevron-down": { family: Feather, name: "chevron-down" },
	"chevron-left": { family: Feather, name: "chevron-left" },
	"chevron-right": { family: Feather, name: "chevron-right" },
	"chevron-up": { family: Feather, name: "chevron-up" },
	close: { family: Feather, name: "x" },
	compass: { family: Feather, name: "compass" },
	globe: { family: Feather, name: "globe" },
	home: { family: Feather, name: "home" },
	info: { family: Feather, name: "info" },
	layout: { family: Feather, name: "layout" },
	loader: { family: Feather, name: "loader" },
	mail: { family: Feather, name: "mail" },
	"menu-panel-left": { family: Feather, name: "sidebar" },
	minus: { family: Feather, name: "minus" },
	moon: { family: Feather, name: "moon" },
	"more-horizontal": { family: Feather, name: "more-horizontal" },
	org: { family: Feather, name: "users" },
	pencil: { family: Feather, name: "edit-2" },
	plus: { family: Feather, name: "plus" },
	search: { family: Feather, name: "search" },
	settings: { family: Feather, name: "settings" },
	sun: { family: Feather, name: "sun" },
	todo: { family: Feather, name: "check-square" },
} as const;

function isOrgIconLibraryId(value: string): value is OrgIconLibraryId {
	return value in iconNameMap;
}

export function AppIcon({ name, size, color, style }: IconProps) {
	const { theme } = useTheme();
	const iconLibrary = isOrgIconLibraryId(theme.iconLibrary)
		? theme.iconLibrary
		: "lucide";
	const config = iconNameMap[iconLibrary][name] ?? fallbackIconMap[name];
	const Family = config.family as NativeIconRenderer;

	return <Family name={config.name} size={size} color={color} style={style} />;
}
