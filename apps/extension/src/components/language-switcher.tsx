import {
	SUPPORTED_LOCALES,
	type SupportedLocale,
	useTranslation,
} from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@pengana/ui/components/dropdown-menu";
import { Globe } from "lucide-react";

function getLocaleLabel(locale: SupportedLocale): string {
	const nativeNames = new Intl.DisplayNames([locale], { type: "language" });
	return nativeNames.of(locale) ?? locale;
}

export function LanguageSwitcher() {
	const { i18n } = useTranslation();

	const handleChange = async (locale: SupportedLocale) => {
		localStorage.setItem("locale", locale);
		window.location.reload();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
				<Globe className="h-[1.2rem] w-[1.2rem]" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
				{SUPPORTED_LOCALES.map((locale) => (
					<DropdownMenuItem
						key={locale}
						onClick={() => handleChange(locale)}
						className={i18n.language === locale ? "font-bold" : ""}
					>
						{getLocaleLabel(locale)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
