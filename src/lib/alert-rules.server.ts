import { eq } from "drizzle-orm";
import { db } from "@/db";
import { alertRules } from "@/db/schema";
import type { AlertRuleKey } from "@/lib/mock-data";

export interface AlertRuleMeta {
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
 * PRESET_BUDGETS in github.functions.ts — callers only ever see the merged
 * result, never invent a rule key of their own.
 *
 * Deliberately its own .server.ts file, not alert-rules.functions.ts: a
 * plain (non-createServerFn) function that touches `db` doesn't get the
 * compiler's client/server split, so if getOrgAlertRules lived in
 * alert-rules.functions.ts (which alerts.tsx imports client-side for the
 * getAlertRules/setAlertRuleEnabled RPC stubs) its db import would ship to
 * the browser and throw there. /api/ingest needs this same lookup and isn't
 * a createServerFn caller, so it imports straight from here too.
 */
export const ALERT_RULES: AlertRuleMeta[] = [
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
		implemented: true,
	},
	{
		key: "score_below_80",
		label: "Score below 80",
		desc: "Fire when workspace median score falls under 80.",
		defaultEnabled: false,
		implemented: true,
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

/** Every known rule for the given org, with its stored on/off state (or the rule's default, if never toggled). */
export async function getOrgAlertRules(
	organizationId: string,
): Promise<AlertRuleItem[]> {
	const rows = await db
		.select({ rule: alertRules.rule, enabled: alertRules.enabled })
		.from(alertRules)
		.where(eq(alertRules.organizationId, organizationId));
	const overrides = new Map(rows.map((r) => [r.rule, r.enabled]));

	return ALERT_RULES.map((r) => ({
		...r,
		enabled: overrides.get(r.key) ?? r.defaultEnabled,
	}));
}
