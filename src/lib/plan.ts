import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organization } from "@/db/schema";
import type { AlertRuleKey } from "@/lib/mock-data";

export type Plan = "free" | "pro";

/** Repos a Free-plan org may have connected at once. Pro is unlimited. */
export const FREE_REPO_LIMIT = 1;

/**
 * Alert rules that only evaluate/fire for Pro orgs — matches the "Custom
 * alert rules" and "Weekly performance digest" line items on /pricing.
 * budget_violation stays free: it's the one rule every plan needs to get any
 * value out of connecting a repo at all.
 */
export const PRO_ONLY_ALERT_RULES: readonly AlertRuleKey[] = [
	"regression_3day",
	"score_below_80",
	"weekly_digest",
];

export function isPro(plan: string | null | undefined): boolean {
	return plan === "pro";
}

/**
 * session.session only carries activeOrganizationId, not the organization
 * row itself, so every server-side plan check needs this lookup. (Client
 * components can read plan directly off authClient.useActiveOrganization()
 * instead — it's a plain additionalField on the org record.)
 */
export async function getOrgPlan(organizationId: string): Promise<Plan> {
	const [row] = await db
		.select({ plan: organization.plan })
		.from(organization)
		.where(eq(organization.id, organizationId))
		.limit(1);
	return row?.plan === "pro" ? "pro" : "free";
}
