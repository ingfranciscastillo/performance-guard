import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { alertRules } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";
import type { AlertRuleKey } from "@/lib/mock-data";

interface AlertRuleMeta {
	key: AlertRuleKey;
	label: string;
	desc: string;
	defaultEnabled: boolean;
	/**
	 * Whether this rule actually evaluates and fires today. The other three
	 * need background evaluation (a 3-day trend check, a scheduled digest)
	 * that doesn't exist yet — toggling them on only saves the preference for
	 * whenever that lands, it doesn't make anything happen right now.
	 */
	implemented: boolean;
}

/**
 * Kept server-side as the source of truth, same reasoning as
 * PRESET_BUDGETS in github.functions.ts — the client only ever sees the
 * merged result, never invents a rule key of its own.
 */
const ALERT_RULES: AlertRuleMeta[] = [
	{
		key: "budget_violation",
		label: "Budget violation",
		desc: "Fire when any PR exceeds a hard budget.",
		defaultEnabled: true,
		implemented: true,
	},
	{
		key: "regression_3day",
		label: "3-day regression",
		desc: "Fire on a 3-day worsening trend on any metric.",
		defaultEnabled: false,
		implemented: false,
	},
	{
		key: "score_below_80",
		label: "Score below 80",
		desc: "Fire when workspace median score falls under 80.",
		defaultEnabled: false,
		implemented: false,
	},
	{
		key: "weekly_digest",
		label: "Weekly digest",
		desc: "Email summary every Monday at 9:00.",
		defaultEnabled: false,
		implemented: false,
	},
];

export interface AlertRuleItem extends AlertRuleMeta {
	enabled: boolean;
}

/** Every known rule for the active org, with its stored on/off state (or the rule's default, if never toggled). */
export const getAlertRules = createServerFn({ method: "GET" }).handler(
	async (): Promise<AlertRuleItem[]> => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) {
			return ALERT_RULES.map((r) => ({ ...r, enabled: r.defaultEnabled }));
		}

		const rows = await db
			.select({ rule: alertRules.rule, enabled: alertRules.enabled })
			.from(alertRules)
			.where(eq(alertRules.organizationId, organizationId));
		const overrides = new Map(rows.map((r) => [r.rule, r.enabled]));

		return ALERT_RULES.map((r) => ({
			...r,
			enabled: overrides.get(r.key) ?? r.defaultEnabled,
		}));
	},
);

export const setAlertRuleEnabled = createServerFn({ method: "POST" })
	.validator((data: { rule: AlertRuleKey; enabled: boolean }) => data)
	.handler(async ({ data }) => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) throw new Error("No active organization");

		await db
			.insert(alertRules)
			.values({
				organizationId,
				rule: data.rule,
				enabled: data.enabled,
			})
			.onConflictDoUpdate({
				target: [alertRules.organizationId, alertRules.rule],
				set: { enabled: data.enabled },
			});
	});
