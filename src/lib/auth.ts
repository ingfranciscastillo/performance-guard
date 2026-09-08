import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import * as schema from "@/db/schema";

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
	plugins: [tanstackStartCookies()],
});
