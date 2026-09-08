import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins/organization";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import * as schema from "@/db/schema";

function slugify(input: string) {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			// Classic OAuth scopes (GitHub Apps aren't wired up yet, see below):
			// - read:user, user:email: identity for login
			// - repo: read PR/commit data, incl. private repos. GitHub has no
			//   read-only classic scope for private repos, only public_repo vs repo.
			// - read:org: list an org's repos for the "connect a repository" picker
			// Posting check-runs/PR comments as "Budgetly" (not as the user) needs
			// a separate GitHub App with installation tokens, not OAuth scopes.
			scope: ["read:user", "user:email", "repo", "read:org"],
		},
	},
	rateLimit: {
		customRules: {
			"/api/auth/sign-in/email": { window: 60, max: 5 },
			"/api/auth/sign-up/email": { window: 60, max: 3 },
		},
	},
	databaseHooks: {
		user: {
			create: {
				// Every screen in the product (repos, budgets, team) is scoped to
				// an organization. Without this, a fresh sign-up has none and the
				// whole app renders empty. Give them a personal workspace they can
				// rename later from Settings -> Organization.
				after: async (user) => {
					// userId can't be combined with session headers (better-auth
					// treats that as ambiguous "who is this for" and rejects it) —
					// this call is impersonation-style, not tied to the request.
					await auth.api.createOrganization({
						body: {
							name: `${user.name}'s Workspace`,
							slug: `${slugify(user.name || user.email.split("@")[0])}-${user.id.slice(0, 6)}`,
							userId: user.id,
						},
					});
				},
			},
		},
	},
	plugins: [
		// Default owner/admin/member roles and permissions for now. The product
		// UI (team.tsx) shows Owner/Admin/Developer/Viewer — that's a separate
		// custom-role/access-control decision, not made yet. Members keep the
		// UI label as display text until real permission checks are designed.
		organization({
			allowUserToCreateOrganization: true,
		}),
		tanstackStartCookies(),
	],
});
