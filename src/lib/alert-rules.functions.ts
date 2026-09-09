import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { alertRules } from "@/db/schema";
import {
	ALERT_RULES,
	type AlertRuleItem,
	getOrgAlertRules,
} from "@/lib/alert-rules.server";
import { ensureSession } from "@/lib/auth.functions";
import type { AlertRuleKey } from "@/lib/mock-data";

export type { AlertRuleItem };

/** Every known rule for the active org, with its stored on/off state (or the rule's default, if never toggled). */
export const getAlertRules = createServerFn({ method: "GET" }).handler(
	async (): Promise<AlertRuleItem[]> => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) {
			return ALERT_RULES.map((r) => ({ ...r, enabled: r.defaultEnabled }));
		}
		return getOrgAlertRules(organizationId);
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
