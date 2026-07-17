import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock node:fs so the module can "read" a report and event payload.
vi.mock("node:fs", () => ({
  readFileSync: (path: string) => {
    if (String(path).includes("report")) return "## DiffWall result: HALT\n";
    if (String(path).includes("event")) return JSON.stringify({ pull_request: { number: 7 } });
    return "";
  },
  appendFileSync: () => undefined
}));

const ORIGINAL_ENV = { ...process.env };

describe("updatePullRequestComment pagination", () => {
  beforeEach(() => {
    process.env.DIFFWALL_REPORT_PATH = "/tmp/report.md";
    process.env.GITHUB_TOKEN = "t";
    process.env.GITHUB_REPOSITORY = "acme/widgets";
    process.env.GITHUB_EVENT_PATH = "/tmp/event.json";
    process.env.GITHUB_API_URL = "https://api.github.test";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("follows Link pagination and updates an existing comment instead of duplicating", async () => {
    const calls: Array<{ url: string; method: string }> = [];
    const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url: String(url), method: init.method ?? "GET" });

      if (String(url).includes("/comments") && (init.method ?? "GET") === "GET") {
        if (!String(url).includes("page=2")) {
          // Page 1: no DiffWall marker, but advertises a next page.
          return new Response(JSON.stringify([{ id: 1, body: "unrelated" }]), {
            status: 200,
            headers: { link: '<https://api.github.test/repos/acme/widgets/issues/7/comments?page=2>; rel="next"' }
          });
        }
        // Page 2: contains the existing DiffWall comment.
        return new Response(JSON.stringify([{ id: 42, body: "<!-- diffwall-report -->\nold" }]), { status: 200 });
      }

      // PATCH update of the existing comment.
      return new Response(JSON.stringify({ id: 42 }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { updatePullRequestComment } = await import("../src/github-comment.js");
    await updatePullRequestComment();

    const patch = calls.find((c) => c.method === "PATCH");
    const post = calls.find((c) => c.method === "POST");
    expect(patch?.url).toContain("/comments/42");
    expect(post).toBeUndefined();
    expect(calls.some((c) => c.url.includes("page=2"))).toBe(true);
  });
});
