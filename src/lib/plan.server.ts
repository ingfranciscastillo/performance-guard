import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organization } from "@/db/schema";
import type { Plan } from "@/lib/plan";

/**
 * Deliberately its own .server.ts file, not plan.ts: plan.ts's isPro/
 * FREE_REPO_LIMIT/PRO_ONLY_ALERT_RULES are imported client-side (alerts.tsx,
 * settings.tsx, repositories/new.tsx), and a plain (non-createServerFn)
 * function that touches `db` doesn't get the compiler's client/server split —
 * if getOrgPlan lived in plan.ts, its `db` import would ship to the browser
 * and throw there (db/index.ts throws at module scope when DATABASE_URL,
 * a server-only env var, isn't set). Same reasoning as alert-rules.server.ts.
 *
 * session.session only carries activeOrganizationId, not the organization
 * row itself, so every server-side plan check needs this lookup. (Client
 * components read plan directly off authClient.useActiveOrganization()
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
