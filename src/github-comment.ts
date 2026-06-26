import { readFileSync, appendFileSync } from "node:fs";

const marker = "<!-- diffwall-report -->";

interface GitHubComment {
  id: number;
  body?: string;
  user?: {
    type?: string;
    login?: string;
  };
}

interface GitHubEvent {
  pull_request?: {
    number?: number;
  };
  issue?: {
    number?: number;
    pull_request?: unknown;
  };
}

export async function updatePullRequestComment(): Promise<void> {
  const reportPath = process.env.DIFFWALL_REPORT_PATH;
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!reportPath) return fallback("DIFFWALL_REPORT_PATH is not set");

  const report = readFileSync(reportPath, "utf8");
  const body = `${marker}\n${report}`;

  if (!token || !repository || !eventPath) return fallback("GitHub token, repository, or event path unavailable", report);

  const event = JSON.parse(readFileSync(eventPath, "utf8")) as GitHubEvent;
  const issueNumber = event.pull_request?.number ?? (event.issue?.pull_request ? event.issue.number : undefined);
  if (!issueNumber) return fallback("No pull request number found in event payload", report);

  const apiBase = process.env.GITHUB_API_URL ?? "https://api.github.com";
  const commentsUrl = `${apiBase}/repos/${repository}/issues/${issueNumber}/comments`;
  const comments = await request<GitHubComment[]>(commentsUrl, token, { method: "GET" });
  const existing = comments.find((comment) => comment.body?.includes(marker));

  if (existing) {
    await request(`${commentsUrl}/${existing.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ body })
    });
    process.stdout.write(`Updated DiffWall PR comment #${existing.id}\n`);
    return;
  }

  const created = await request<GitHubComment>(commentsUrl, token, {
    method: "POST",
    body: JSON.stringify({ body })
  });
  process.stdout.write(`Created DiffWall PR comment #${created.id}\n`);
}

async function request<T>(url: string, token: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "accept": "application/vnd.github+json",
      "authorization": `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`GitHub API request failed: ${response.status} ${details}`);
  }

  return response.json() as Promise<T>;
}

function fallback(reason: string, report?: string): void {
  process.stdout.write(`Skipping PR comment update: ${reason}\n`);
  if (process.env.GITHUB_STEP_SUMMARY && report) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updatePullRequestComment().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
