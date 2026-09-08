// Brand motion signature: precise and engineered, not playful.
// One ease-out for everything entering, one ease-in (faster, per exit
// conventions) for everything leaving. Reused everywhere instead of ad hoc
// curves per component so the whole product moves the same way.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

export const staggerContainer = {
	hidden: {},
	show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export function staggerItem(reduce: boolean | null) {
	return {
		hidden: reduce ? {} : { opacity: 0, y: 14 },
		show: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.45, ease: EASE_OUT },
		},
	};
}
