import { SUPPORTED_LOCALES, type SupportedLocale } from "@pengana/i18n";
import { Globe } from "lucide-react";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./dropdown-menu";

function getLocaleLabel(locale: SupportedLocale): string {
	const nativeNames = new Intl.DisplayNames([locale], { type: "language" });
	return nativeNames.of(locale) ?? locale;
}

interface LanguageSwitcherProps {
	currentLocale: SupportedLocale;
	onLocaleChange: (locale: SupportedLocale) => void;
}

export function LanguageSwitcher({
	currentLocale,
	onLocaleChange,
}: LanguageSwitcherProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
				<Globe className="h-[1.2rem] w-[1.2rem]" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
				{SUPPORTED_LOCALES.map((locale) => (
					<DropdownMenuItem
						key={locale}
						onClick={() => onLocaleChange(locale)}
						className={currentLocale === locale ? "font-bold" : ""}
					>
						{getLocaleLabel(locale)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
