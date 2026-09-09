import { timeAgo } from "@/lib/format";

export interface GhRepo {
	id: string;
	name: string;
	fullName: string;
	defaultBranch: string;
	private: boolean;
	stars: number;
	language: string;
	updated: string;
	org: string;
}

/** Shape of the fields we read from GitHub's REST API repo object. */
interface GithubApiRepo {
	id: number;
	name: string;
	full_name: string;
	default_branch: string;
	private: boolean;
	stargazers_count: number;
	language: string | null;
	pushed_at: string | null;
	owner: { login: string };
}

function mapRepo(r: GithubApiRepo): GhRepo {
	return {
		id: String(r.id),
		name: r.name,
		fullName: r.full_name,
		defaultBranch: r.default_branch,
		private: r.private,
		stars: r.stargazers_count,
		language: r.language ?? "Unknown",
		updated: timeAgo(r.pushed_at),
		org: r.owner.login,
	};
}

/**
 * Lists repos the given GitHub access token can see (personal + org repos the
 * token was granted `repo`/`read:org` scope for). Paginates up to 300 repos
 * (3 pages) — a real "load more" flow would be needed beyond that.
 */
export async function listGithubRepos(accessToken: string): Promise<GhRepo[]> {
	const repos: GhRepo[] = [];
	for (let page = 1; page <= 3; page++) {
		const res = await fetch(
			`https://api.github.com/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,organization_member`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
				},
			},
		);
		if (!res.ok) {
			throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
		}
		const pageRepos = (await res.json()) as GithubApiRepo[];
		repos.push(...pageRepos.map(mapRepo));
		if (pageRepos.length < 100) break;
	}
	return repos;
}

/**
 * Reads package.json's "scripts" from a repo's default branch, to pick a
 * real serve command instead of guessing "start" for everyone. Returns null
 * if there's no package.json at the repo root, or it doesn't parse — not
 * every project is a root-level Node package (monorepos, non-JS projects),
 * and the caller falls back to a placeholder in that case.
 */
export async function getPackageJsonScripts(
	accessToken: string,
	fullName: string,
): Promise<Record<string, string> | null> {
	const res = await fetch(
		`https://api.github.com/repos/${fullName}/contents/package.json`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			},
		},
	);
	if (!res.ok) return null;

	try {
		const file = (await res.json()) as { content: string; encoding: string };
		if (file.encoding !== "base64") return null;
		const pkg = JSON.parse(
			Buffer.from(file.content, "base64").toString("utf8"),
		);
		return pkg && typeof pkg.scripts === "object" ? pkg.scripts : null;
	} catch {
		return null;
	}
}

/**
 * Picks which package.json script serves a production build, in the order a
 * user would actually reach for one: "start" (the Node/Next.js convention),
 * then "preview" (Vite/Astro's equivalent), then "serve". Returns null if
 * scripts don't exist or none of these are defined — the caller must fall
 * back to a placeholder the user fills in by hand.
 */
export function pickServeScript(
	scripts: Record<string, string> | null,
): string | null {
	if (!scripts) return null;
	for (const candidate of ["start", "preview", "serve"]) {
		if (scripts[candidate]) return candidate;
	}
	return null;
}

export type CommitWorkflowResult =
	| { status: "created" }
	| { status: "updated" }
	| { status: "already-exists" }
	| { status: "error"; message: string };

/**
 * First line of every workflow Budgetly generates. Lets commitWorkflowFile
 * tell "a file we generated, safe to regenerate on reconnect" apart from "the
 * user wrote their own workflow at this path, don't touch it" — without this
 * marker there'd be no way to support disconnect+reconnect picking up a
 * template change without also risking clobbering a hand-written file.
 */
export const WORKFLOW_MANAGED_MARKER = "# Managed by Budgetly.";

/**
 * Commits the Budgetly GitHub Action workflow to a repo, at
 * .github/workflows/budgetly.yml, using the user's own OAuth token (this
 * shows up as a real commit authored by them). If a file already exists at
 * that path: overwrites it when it's one Budgetly generated before (carries
 * WORKFLOW_MANAGED_MARKER — this is how disconnecting and reconnecting a repo
 * picks up template changes), otherwise leaves it alone so a user's own
 * hand-written workflow is never silently clobbered.
 */
export async function commitWorkflowFile(
	accessToken: string,
	fullName: string,
	content: string,
): Promise<CommitWorkflowResult> {
	const path = ".github/workflows/budgetly.yml";
	const url = `https://api.github.com/repos/${fullName}/contents/${path}`;
	const headers = {
		Authorization: `Bearer ${accessToken}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};

	const existing = await fetch(url, { headers });
	let existingSha: string | undefined;
	if (existing.status === 200) {
		const file = (await existing.json()) as {
			content: string;
			encoding: string;
			sha: string;
		};
		const existingContent =
			file.encoding === "base64"
				? Buffer.from(file.content, "base64").toString("utf8")
				: "";
		if (!existingContent.startsWith(WORKFLOW_MANAGED_MARKER)) {
			return { status: "already-exists" };
		}
		existingSha = file.sha;
	} else if (existing.status !== 404) {
		return {
			status: "error",
			message: `GitHub API error checking for existing file: ${existing.status}`,
		};
	}

	const res = await fetch(url, {
		method: "PUT",
		headers: { ...headers, "content-type": "application/json" },
		body: JSON.stringify({
			message: existingSha
				? "Update Budgetly performance budget workflow"
				: "Add Budgetly performance budget workflow",
			content: Buffer.from(content, "utf8").toString("base64"),
			...(existingSha ? { sha: existingSha } : {}),
		}),
	});
	if (!res.ok) {
		return {
			status: "error",
			message: `GitHub API error: ${res.status} ${await res.text()}`,
		};
	}
	if (existingSha) return { status: "updated" };
	return { status: "created" };
}
