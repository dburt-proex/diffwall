import { readFileSync, appendFileSync } from "node:fs";
const marker = "<!-- diffwall-report -->";
export async function updatePullRequestComment() {
    const reportPath = process.env.DIFFWALL_REPORT_PATH;
    const token = process.env.GITHUB_TOKEN;
    const repository = process.env.GITHUB_REPOSITORY;
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!reportPath)
        return fallback("DIFFWALL_REPORT_PATH is not set");
    const report = readFileSync(reportPath, "utf8");
    const body = `${marker}\n${report}`;
    if (!token || !repository || !eventPath)
        return fallback("GitHub token, repository, or event path unavailable", report);
    const event = JSON.parse(readFileSync(eventPath, "utf8"));
    const issueNumber = event.pull_request?.number ?? (event.issue?.pull_request ? event.issue.number : undefined);
    if (!issueNumber)
        return fallback("No pull request number found in event payload", report);
    const apiBase = process.env.GITHUB_API_URL ?? "https://api.github.com";
    const commentsUrl = `${apiBase}/repos/${repository}/issues/${issueNumber}/comments`;
    const comments = await listAllComments(commentsUrl, token);
    const existing = comments.find((comment) => comment.body?.includes(marker));
    if (existing) {
        await request(`${commentsUrl}/${existing.id}`, token, {
            method: "PATCH",
            body: JSON.stringify({ body })
        });
        process.stdout.write(`Updated DiffWall PR comment #${existing.id}\n`);
        return;
    }
    const created = await request(commentsUrl, token, {
        method: "POST",
        body: JSON.stringify({ body })
    });
    process.stdout.write(`Created DiffWall PR comment #${created.id}\n`);
}
/**
 * Fetch every page of PR comments. Without following pagination a busy PR
 * (>30 comments) would hide the existing DiffWall comment and cause a new
 * duplicate to be posted on each run.
 */
async function listAllComments(commentsUrl, token) {
    const all = [];
    const separator = commentsUrl.includes("?") ? "&" : "?";
    let url = `${commentsUrl}${separator}per_page=100`;
    while (url) {
        const response = await requestRaw(url, token, { method: "GET" });
        all.push(...(await response.json()));
        url = nextPageUrl(response.headers.get("link"));
    }
    return all;
}
/** Extract the `rel="next"` URL from a GitHub Link header, if present. */
function nextPageUrl(linkHeader) {
    if (!linkHeader)
        return undefined;
    for (const part of linkHeader.split(",")) {
        const match = part.match(/<([^>]+)>;\s*rel="next"/);
        if (match)
            return match[1];
    }
    return undefined;
}
async function requestRaw(url, token, init) {
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
    return response;
}
async function request(url, token, init) {
    const response = await requestRaw(url, token, init);
    return response.json();
}
function fallback(reason, report) {
    process.stdout.write(`Skipping PR comment update: ${reason}\n`);
    if (process.env.GITHUB_STEP_SUMMARY && report)
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
}
if (import.meta.url === `file://${process.argv[1]}`) {
    updatePullRequestComment().catch((error) => {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
        process.exitCode = 1;
    });
}
