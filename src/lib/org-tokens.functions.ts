import { createHash, randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orgTokens } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";

function generateRawToken() {
	return `bgtly_${randomBytes(24).toString("hex")}`;
}

export function hashToken(raw: string) {
	return createHash("sha256").update(raw).digest("hex");
}

/**
 * Looks up which organization a raw CI token belongs to, for the ingest API
 * route (called by a GitHub Action, not a logged-in browser session — this is
 * not a createServerFn, it's a plain function the route handler calls).
 */
export async function verifyOrgToken(rawToken: string): Promise<string | null> {
	const [row] = await db
		.select({ id: orgTokens.id, organizationId: orgTokens.organizationId })
		.from(orgTokens)
		.where(eq(orgTokens.tokenHash, hashToken(rawToken)))
		.limit(1);
	if (!row) return null;
	// Best-effort; a failed timestamp update shouldn't fail the ingest request.
	db.update(orgTokens)
		.set({ lastUsedAt: new Date() })
		.where(eq(orgTokens.id, row.id))
		.catch(() => {});
	return row.organizationId;
}

export const createOrgToken = createServerFn({ method: "POST" }).handler(
	async () => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) throw new Error("No active organization");

		const raw = generateRawToken();
		await db.insert(orgTokens).values({
			organizationId,
			tokenHash: hashToken(raw),
			lastFour: raw.slice(-4),
		});

		// Shown once — we only ever stored the hash.
		return { token: raw };
	},
);

export const listOrgTokens = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) return [];

		return db
			.select({
				id: orgTokens.id,
				lastFour: orgTokens.lastFour,
				createdAt: orgTokens.createdAt,
				lastUsedAt: orgTokens.lastUsedAt,
			})
			.from(orgTokens)
			.where(eq(orgTokens.organizationId, organizationId))
			.orderBy(desc(orgTokens.createdAt));
	},
);

export const revokeOrgToken = createServerFn({ method: "POST" })
	.validator((tokenId: string) => tokenId)
	.handler(async ({ data: tokenId }) => {
		const session = await ensureSession();
		const organizationId = session.session.activeOrganizationId;
		if (!organizationId) throw new Error("No active organization");

		await db
			.delete(orgTokens)
			.where(
				and(
					eq(orgTokens.id, tokenId),
					eq(orgTokens.organizationId, organizationId),
				),
			);
	});
