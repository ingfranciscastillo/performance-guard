// Precise left-to-right underline draw on hover, used for every plain-text
// nav/footer/legal link so the whole site shares one link interaction.
export const linkUnderline =
	"relative inline-block w-fit after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 after:ease-out hover:text-foreground hover:after:scale-x-100";
