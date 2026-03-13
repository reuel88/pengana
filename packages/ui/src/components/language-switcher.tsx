import { LOCALE_OPTIONS, type SupportedLocale } from "@pengana/i18n";
import { Globe } from "lucide-react";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./dropdown-menu";

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
				{LOCALE_OPTIONS.map(({ value, label }) => (
					<DropdownMenuItem
						key={value}
						onClick={() => onLocaleChange(value)}
						className={currentLocale === value ? "font-bold" : ""}
					>
						{label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
