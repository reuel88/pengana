import type { AppIconName } from "@pengana/org-client";
import {
	Bell as PhosphorBell,
	CaretDown as PhosphorCaretDown,
	CaretLeft as PhosphorCaretLeft,
	CaretRight as PhosphorCaretRight,
	CaretUp as PhosphorCaretUp,
	Check as PhosphorCheck,
	DotsThree as PhosphorDotsThree,
	Envelope as PhosphorEnvelope,
	Globe as PhosphorGlobe,
	MagnifyingGlass as PhosphorMagnifyingGlass,
	Minus as PhosphorMinus,
	Moon as PhosphorMoon,
	Plus as PhosphorPlus,
	SidebarSimple as PhosphorSidebarSimple,
	SpinnerGap as PhosphorSpinnerGap,
	Sun as PhosphorSun,
	WarningCircle as PhosphorWarningCircle,
	X as PhosphorX,
} from "@phosphor-icons/react";
import {
	RiAddLine,
	RiAlertLine,
	RiArrowDownSLine,
	RiArrowLeftSLine,
	RiArrowRightSLine,
	RiArrowUpSLine,
	RiCheckLine,
	RiCloseLine,
	RiGlobalLine,
	RiLayoutLeftLine,
	RiLoader4Line,
	RiMailLine,
	RiMoonLine,
	RiMoreLine,
	RiNotification3Line,
	RiSearchLine,
	RiSubtractLine,
	RiSunLine,
} from "@remixicon/react";
import {
	IconAlertCircle,
	IconBell,
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronUp,
	IconDots,
	IconLayoutSidebar,
	IconLoader2,
	IconMail,
	IconMinus,
	IconMoon,
	IconPlus,
	IconSearch,
	IconSun,
	IconWorld,
	IconX,
} from "@tabler/icons-react";
import type { LucideProps } from "lucide-react/dist/esm/lucide-react.js";
import {
	Bell as LucideBell,
	CheckIcon as LucideCheckIcon,
	ChevronDownIcon as LucideChevronDownIcon,
	ChevronLeftIcon as LucideChevronLeftIcon,
	ChevronRightIcon as LucideChevronRightIcon,
	ChevronUpIcon as LucideChevronUpIcon,
	CircleAlert as LucideCircleAlert,
	CircleCheckIcon as LucideCircleCheckIcon,
	Globe as LucideGlobe,
	InfoIcon as LucideInfoIcon,
	Loader2 as LucideLoader2,
	Loader2Icon as LucideLoader2Icon,
	Mail as LucideMail,
	MinusIcon as LucideMinusIcon,
	Moon as LucideMoon,
	MoreHorizontalIcon as LucideMoreHorizontalIcon,
	OctagonXIcon as LucideOctagonXIcon,
	PanelLeftIcon as LucidePanelLeftIcon,
	PlusIcon as LucidePlusIcon,
	SearchIcon as LucideSearchIcon,
	Sun as LucideSun,
	TriangleAlertIcon as LucideTriangleAlertIcon,
	XIcon as LucideXIcon,
} from "lucide-react/dist/esm/lucide-react.js";
import type { ComponentProps, ComponentType } from "react";
import { useSyncExternalStore } from "react";

type WebIconLibrary =
	| "lucide"
	| "tabler"
	| "phosphor"
	| "remixicon"
	| "hugeicons";
type IconComponent = ComponentType<LucideProps>;

const VALID_LIBRARIES = [
	"lucide",
	"tabler",
	"phosphor",
	"remixicon",
	"hugeicons",
] as const satisfies readonly WebIconLibrary[];

const lucideComponents = {
	Bell: LucideBell,
	CheckIcon: LucideCheckIcon,
	CircleCheckIcon: LucideCircleCheckIcon,
	ChevronDownIcon: LucideChevronDownIcon,
	ChevronLeftIcon: LucideChevronLeftIcon,
	ChevronRightIcon: LucideChevronRightIcon,
	ChevronUpIcon: LucideChevronUpIcon,
	CircleAlert: LucideCircleAlert,
	Globe: LucideGlobe,
	InfoIcon: LucideInfoIcon,
	Loader2: LucideLoader2,
	Loader2Icon: LucideLoader2Icon,
	Mail: LucideMail,
	MinusIcon: LucideMinusIcon,
	Moon: LucideMoon,
	MoreHorizontalIcon: LucideMoreHorizontalIcon,
	OctagonXIcon: LucideOctagonXIcon,
	PanelLeftIcon: LucidePanelLeftIcon,
	PlusIcon: LucidePlusIcon,
	SearchIcon: LucideSearchIcon,
	Sun: LucideSun,
	TriangleAlertIcon: LucideTriangleAlertIcon,
	XIcon: LucideXIcon,
} as const;

const iconNameMap: Record<keyof typeof lucideComponents, AppIconName> = {
	Bell: "bell",
	CheckIcon: "check",
	CircleCheckIcon: "check",
	ChevronDownIcon: "chevron-down",
	ChevronLeftIcon: "chevron-left",
	ChevronRightIcon: "chevron-right",
	ChevronUpIcon: "chevron-up",
	CircleAlert: "alert",
	Globe: "globe",
	InfoIcon: "info",
	Loader2: "loader",
	Loader2Icon: "loader",
	Mail: "mail",
	MinusIcon: "minus",
	Moon: "moon",
	MoreHorizontalIcon: "more-horizontal",
	OctagonXIcon: "close",
	PanelLeftIcon: "menu-panel-left",
	PlusIcon: "plus",
	SearchIcon: "search",
	Sun: "sun",
	TriangleAlertIcon: "alert",
	XIcon: "close",
};

const tablerComponents: Partial<Record<AppIconName, IconComponent>> = {
	alert: IconAlertCircle,
	bell: IconBell,
	check: IconCheck,
	"chevron-down": IconChevronDown,
	"chevron-left": IconChevronLeft,
	"chevron-right": IconChevronRight,
	"chevron-up": IconChevronUp,
	close: IconX,
	globe: IconWorld,
	loader: IconLoader2,
	mail: IconMail,
	minus: IconMinus,
	moon: IconMoon,
	"more-horizontal": IconDots,
	"menu-panel-left": IconLayoutSidebar,
	plus: IconPlus,
	search: IconSearch,
	sun: IconSun,
};

function toPhosphorProps(
	props: LucideProps,
): ComponentProps<typeof PhosphorBell> {
	return {
		size:
			typeof props.size === "number" || typeof props.size === "string"
				? props.size
				: undefined,
		color: props.color,
		className: props.className,
		style: props.style,
		weight: "regular",
	};
}

const phosphorComponents: Partial<Record<AppIconName, IconComponent>> = {
	alert: ((props) => (
		<PhosphorWarningCircle {...toPhosphorProps(props)} />
	)) as IconComponent,
	bell: ((props) => (
		<PhosphorBell {...toPhosphorProps(props)} />
	)) as IconComponent,
	check: ((props) => (
		<PhosphorCheck {...toPhosphorProps(props)} />
	)) as IconComponent,
	"chevron-down": ((props) => (
		<PhosphorCaretDown {...toPhosphorProps(props)} />
	)) as IconComponent,
	"chevron-left": ((props) => (
		<PhosphorCaretLeft {...toPhosphorProps(props)} />
	)) as IconComponent,
	"chevron-right": ((props) => (
		<PhosphorCaretRight {...toPhosphorProps(props)} />
	)) as IconComponent,
	"chevron-up": ((props) => (
		<PhosphorCaretUp {...toPhosphorProps(props)} />
	)) as IconComponent,
	close: ((props) => (
		<PhosphorX {...toPhosphorProps(props)} />
	)) as IconComponent,
	globe: ((props) => (
		<PhosphorGlobe {...toPhosphorProps(props)} />
	)) as IconComponent,
	loader: ((props) => (
		<PhosphorSpinnerGap {...toPhosphorProps(props)} />
	)) as IconComponent,
	mail: ((props) => (
		<PhosphorEnvelope {...toPhosphorProps(props)} />
	)) as IconComponent,
	minus: ((props) => (
		<PhosphorMinus {...toPhosphorProps(props)} />
	)) as IconComponent,
	moon: ((props) => (
		<PhosphorMoon {...toPhosphorProps(props)} />
	)) as IconComponent,
	"more-horizontal": ((props) => (
		<PhosphorDotsThree {...toPhosphorProps(props)} />
	)) as IconComponent,
	"menu-panel-left": ((props) => (
		<PhosphorSidebarSimple {...toPhosphorProps(props)} />
	)) as IconComponent,
	plus: ((props) => (
		<PhosphorPlus {...toPhosphorProps(props)} />
	)) as IconComponent,
	search: ((props) => (
		<PhosphorMagnifyingGlass {...toPhosphorProps(props)} />
	)) as IconComponent,
	sun: ((props) => (
		<PhosphorSun {...toPhosphorProps(props)} />
	)) as IconComponent,
};

function toRemixiconProps(
	props: LucideProps,
): ComponentProps<typeof RiAddLine> {
	return {
		size:
			typeof props.size === "number" || typeof props.size === "string"
				? props.size
				: undefined,
		color: props.color,
		className: props.className,
		style: props.style,
	};
}

const remixiconComponents: Partial<Record<AppIconName, IconComponent>> = {
	alert: ((props) => (
		<RiAlertLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	bell: ((props) => (
		<RiNotification3Line {...toRemixiconProps(props)} />
	)) as IconComponent,
	check: ((props) => (
		<RiCheckLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	"chevron-down": ((props) => (
		<RiArrowDownSLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	"chevron-left": ((props) => (
		<RiArrowLeftSLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	"chevron-right": ((props) => (
		<RiArrowRightSLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	"chevron-up": ((props) => (
		<RiArrowUpSLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	close: ((props) => (
		<RiCloseLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	globe: ((props) => (
		<RiGlobalLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	loader: ((props) => (
		<RiLoader4Line {...toRemixiconProps(props)} />
	)) as IconComponent,
	mail: ((props) => (
		<RiMailLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	minus: ((props) => (
		<RiSubtractLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	moon: ((props) => (
		<RiMoonLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	"more-horizontal": ((props) => (
		<RiMoreLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	"menu-panel-left": ((props) => (
		<RiLayoutLeftLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	plus: ((props) => (
		<RiAddLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	search: ((props) => (
		<RiSearchLine {...toRemixiconProps(props)} />
	)) as IconComponent,
	sun: ((props) => <RiSunLine {...toRemixiconProps(props)} />) as IconComponent,
};

function isValidLibrary(value: unknown): value is WebIconLibrary {
	return (
		typeof value === "string" &&
		(VALID_LIBRARIES as readonly string[]).includes(value)
	);
}

function subscribe(callback: () => void) {
	if (typeof document === "undefined") return () => {};

	const observer = new MutationObserver(() => callback());
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-org-icon-library"],
	});

	return () => observer.disconnect();
}

function getSnapshot(): WebIconLibrary {
	if (typeof document === "undefined") return "lucide";

	const value = document.documentElement.dataset.orgIconLibrary;
	return isValidLibrary(value) ? value : "lucide";
}

function useCurrentIconLibrary() {
	return useSyncExternalStore(
		subscribe,
		getSnapshot,
		(): WebIconLibrary => "lucide",
	);
}

const libraryComponentMap: Record<
	WebIconLibrary,
	Partial<Record<AppIconName, IconComponent>> | null
> = {
	lucide: null,
	tabler: tablerComponents,
	phosphor: phosphorComponents,
	remixicon: remixiconComponents,
	hugeicons: null,
};

function renderIcon(
	name: keyof typeof lucideComponents,
	props: LucideProps,
	library: WebIconLibrary,
) {
	const semanticName = iconNameMap[name];
	const components = libraryComponentMap[library];
	const Component = components?.[semanticName];

	if (Component) {
		return <Component {...props} />;
	}

	const LucideComponent = lucideComponents[name];
	return <LucideComponent {...props} />;
}

function createIcon(name: keyof typeof lucideComponents) {
	const Component = (props: LucideProps) => {
		const library = useCurrentIconLibrary();
		return renderIcon(name, props, library);
	};

	Component.displayName = name;
	return Component;
}

export const Bell = createIcon("Bell");
export const CheckIcon = createIcon("CheckIcon");
export const CircleCheckIcon = createIcon("CircleCheckIcon");
export const ChevronDownIcon = createIcon("ChevronDownIcon");
export const ChevronLeftIcon = createIcon("ChevronLeftIcon");
export const ChevronRightIcon = createIcon("ChevronRightIcon");
export const ChevronUpIcon = createIcon("ChevronUpIcon");
export const CircleAlert = createIcon("CircleAlert");
export const Globe = createIcon("Globe");
export const InfoIcon = createIcon("InfoIcon");
export const Loader2 = createIcon("Loader2");
export const Loader2Icon = createIcon("Loader2Icon");
export const Mail = createIcon("Mail");
export const MinusIcon = createIcon("MinusIcon");
export const Moon = createIcon("Moon");
export const MoreHorizontalIcon = createIcon("MoreHorizontalIcon");
export const OctagonXIcon = createIcon("OctagonXIcon");
export const PanelLeftIcon = createIcon("PanelLeftIcon");
export const PlusIcon = createIcon("PlusIcon");
export const SearchIcon = createIcon("SearchIcon");
export const Sun = createIcon("Sun");
export const TriangleAlertIcon = createIcon("TriangleAlertIcon");
export const XIcon = createIcon("XIcon");
