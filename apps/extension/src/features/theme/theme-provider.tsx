import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") {
		return "dark";
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
	return theme === "system" ? getSystemTheme() : theme;
}

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
	attribute?: "class";
};

export function ThemeProvider({
	children,
	defaultTheme = "dark",
	storageKey = "vite-ui-theme",
	attribute = "class",
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") {
			return defaultTheme;
		}

		const stored = window.localStorage.getItem(storageKey);
		return stored === "light" || stored === "dark" || stored === "system"
			? stored
			: defaultTheme;
	});
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
		resolveTheme(theme),
	);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const applyTheme = (nextTheme: Theme) => {
			const nextResolvedTheme = resolveTheme(nextTheme);
			setResolvedTheme(nextResolvedTheme);

			if (attribute === "class") {
				document.documentElement.classList.toggle(
					"dark",
					nextResolvedTheme === "dark",
				);
			}
		};

		applyTheme(theme);

		const handleChange = () => {
			if (theme === "system") {
				applyTheme("system");
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [attribute, theme]);

	const setTheme = useCallback(
		(nextTheme: Theme) => {
			window.localStorage.setItem(storageKey, nextTheme);
			setThemeState(nextTheme);
		},
		[storageKey],
	);

	const value = useMemo(
		() => ({ theme, resolvedTheme, setTheme }),
		[resolvedTheme, setTheme, theme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}

	return context;
}
