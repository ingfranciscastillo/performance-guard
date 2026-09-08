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

export type CommitWorkflowResult =
	| { status: "created" }
	| { status: "already-exists" }
	| { status: "error"; message: string };

/**
 * Commits the Budgetly GitHub Action workflow to a repo, at
 * .github/workflows/budgetly.yml, using the user's own OAuth token (this
 * shows up as a real commit authored by them). Never overwrites an existing
 * file at that path — connecting a repo a second time, or a user who already
 * has a workflow there, must not silently clobber it.
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
	if (existing.status === 200) return { status: "already-exists" };
	if (existing.status !== 404) {
		return {
			status: "error",
			message: `GitHub API error checking for existing file: ${existing.status}`,
		};
	}

	const res = await fetch(url, {
		method: "PUT",
		headers: { ...headers, "content-type": "application/json" },
		body: JSON.stringify({
			message: "Add Budgetly performance budget workflow",
			content: Buffer.from(content, "utf8").toString("base64"),
		}),
	});
	if (!res.ok) {
		return {
			status: "error",
			message: `GitHub API error: ${res.status} ${await res.text()}`,
		};
	}
	return { status: "created" };
}
