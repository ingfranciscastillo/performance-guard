import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
	const { theme, toggle } = useTheme();
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggle}
			aria-label="Toggle theme"
		>
			{theme === "dark" ? (
				<SunIcon className="h-4 w-4" />
			) : (
				<MoonIcon className="h-4 w-4" />
			)}
		</Button>
	);
}
