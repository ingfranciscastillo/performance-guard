import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orgTokens } from "@/db/schema";

/**
 * Looks up which organization a raw CI token belongs to, for the ingest API
 * route (called by a GitHub Action, not a logged-in browser session — not a
 * createServerFn, just a plain function the route handler calls).
 *
 * Deliberately its own .server.ts file, never imported by client code: a
 * plain (non-createServerFn) function that touches `db` doesn't get the
 * compiler's client/server split the way createServerFn handlers do, so if
 * it lived in org-tokens.functions.ts (which client components import for
 * the createOrgToken/listOrgTokens/revokeOrgToken RPC stubs) its db import —
 * and db/index.ts's module-level DATABASE_URL check — would ship to the
 * browser and throw there, since that env var isn't available client-side.
 */
export async function verifyOrgToken(rawToken: string): Promise<string | null> {
	const tokenHash = createHash("sha256").update(rawToken).digest("hex");
	const [row] = await db
		.select({ id: orgTokens.id, organizationId: orgTokens.organizationId })
		.from(orgTokens)
		.where(eq(orgTokens.tokenHash, tokenHash))
		.limit(1);
	if (!row) return null;
	// Best-effort; a failed timestamp update shouldn't fail the ingest request.
	db.update(orgTokens)
		.set({ lastUsedAt: new Date() })
		.where(eq(orgTokens.id, row.id))
		.catch(() => {});
	return row.organizationId;
}
