import { relations } from "drizzle-orm";
import {
	boolean,
	doublePrecision,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
	Action,
	AlertChannel,
	AlertLevel,
	MetricKey,
	PrStatus,
	Severity,
} from "@/lib/mock-data";
import { organization } from "./auth-schema";

function id() {
	return text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());
}

/**
 * A GitHub repository connected to a Budgetly organization via the GitHub App
 * installation. Health/open-PR counts are computed from `pullRequests`, not
 * stored here.
 */
export const repos = pgTable(
	"repos",
	{
		id: id(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		/** GitHub's numeric repo id, e.g. 123456789. Stable across renames. */
		githubRepoId: text("github_repo_id").notNull(),
		name: text("name").notNull(),
		/** owner/name, e.g. "acme/storefront" */
		fullName: text("full_name").notNull(),
		defaultBranch: text("default_branch").notNull(),
		private: boolean("private").notNull().default(false),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		uniqueIndex("repos_organization_id_github_repo_id_unique").on(
			t.organizationId,
			t.githubRepoId,
		),
	],
);

/** One performance budget per metric per repo. */
export const budgets = pgTable(
	"budgets",
	{
		id: id(),
		repoId: text("repo_id")
			.notNull()
			.references(() => repos.id, { onDelete: "cascade" }),
		metric: text("metric").notNull().$type<MetricKey>(),
		/** Threshold value in the metric's native unit (ms, unitless CLS, or 0-100 score). */
		max: doublePrecision("max").notNull(),
		severity: text("severity").notNull().$type<Severity>(),
		action: text("action").notNull().$type<Action>(),
	},
	(t) => [uniqueIndex("budgets_repo_id_metric_unique").on(t.repoId, t.metric)],
);

/**
 * Metric values keyed by MetricKey, e.g. { LCP: 2380, INP: 180, CLS: 0.07 }.
 * Not every metric is guaranteed present (a run can fail partway through).
 */
type MetricSnapshot = Partial<Record<MetricKey, number>>;

export const pullRequests = pgTable(
	"pull_requests",
	{
		id: id(),
		repoId: text("repo_id")
			.notNull()
			.references(() => repos.id, { onDelete: "cascade" }),
		number: integer("number").notNull(),
		title: text("title").notNull(),
		/** GitHub login of the PR author. Not a Budgetly user reference — most PR authors never sign in. */
		author: text("author").notNull(),
		branch: text("branch").notNull(),
		status: text("status").notNull().$type<PrStatus>(),
		openedAt: timestamp("opened_at").notNull(),
		/** Latest Lighthouse run on the PR's head commit. */
		metrics: jsonb("metrics").notNull().$type<MetricSnapshot>(),
		/** Latest Lighthouse run on the repo's default branch, at PR open time. */
		baseline: jsonb("baseline").notNull().$type<MetricSnapshot>(),
	},
	(t) => [
		uniqueIndex("pull_requests_repo_id_number_unique").on(t.repoId, t.number),
	],
);

/**
 * A CI token that authenticates a GitHub Action's ingest requests for one
 * organization. Only the SHA-256 hash is stored — the raw token is shown once
 * at creation (createOrgToken) and never again, same as a GitHub PAT.
 */
export const orgTokens = pgTable("org_tokens", {
	id: id(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	tokenHash: text("token_hash").notNull().unique(),
	/** Last 4 chars of the raw token, so a user can tell tokens apart in a list without re-seeing the value. */
	lastFour: text("last_four").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	lastUsedAt: timestamp("last_used_at"),
});

export const alerts = pgTable("alerts", {
	id: id(),
	repoId: text("repo_id")
		.notNull()
		.references(() => repos.id, { onDelete: "cascade" }),
	channel: text("channel").notNull().$type<AlertChannel>(),
	level: text("level").notNull().$type<AlertLevel>(),
	title: text("title").notNull(),
	message: text("message").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reposRelations = relations(repos, ({ many, one }) => ({
	organization: one(organization, {
		fields: [repos.organizationId],
		references: [organization.id],
	}),
	budgets: many(budgets),
	pullRequests: many(pullRequests),
	alerts: many(alerts),
}));

export const orgTokensRelations = relations(orgTokens, ({ one }) => ({
	organization: one(organization, {
		fields: [orgTokens.organizationId],
		references: [organization.id],
	}),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
	repo: one(repos, { fields: [budgets.repoId], references: [repos.id] }),
}));

export const pullRequestsRelations = relations(pullRequests, ({ one }) => ({
	repo: one(repos, { fields: [pullRequests.repoId], references: [repos.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
	repo: one(repos, { fields: [alerts.repoId], references: [repos.id] }),
}));

export type NewRepo = typeof repos.$inferInsert;
export type RepoRow = typeof repos.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type BudgetRow = typeof budgets.$inferSelect;
export type NewPullRequest = typeof pullRequests.$inferInsert;
export type PullRequestRow = typeof pullRequests.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type AlertRow = typeof alerts.$inferSelect;
export type NewOrgToken = typeof orgTokens.$inferInsert;
export type OrgTokenRow = typeof orgTokens.$inferSelect;
