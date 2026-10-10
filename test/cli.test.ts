import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporary: string[] = [];
const policy = readFileSync("rules/default.yml", "utf8");
function temp(): string {
  const dir = mkdtempSync(join(tmpdir(), "diffwall-cli-"));
  temporary.push(dir);
  return dir;
}
function cli(fixture: string, ...flags: string[]) {
  return spawnSync(process.execPath, [resolve("dist/cli.js"), "scan", "--diff",
    resolve("test/fixtures", fixture), "--format", "json", ...flags], { encoding: "utf8" });
}
afterEach(() => temporary.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));

describe("CLI enforcement", () => {
  it.each([
    ["safe-doc-change.diff", "ALLOW", 0],
    ["review-dependency-change.diff", "REVIEW", 3],
    ["migration-drop-table.diff", "HALT", 2]
  ])("preserves %s evidence before enforcing", (fixture, route, status) => {
    const result = cli(fixture, "--config", resolve("rules/default.yml"),
      "--require-config", "--fail-on-review", "--fail-on-halt");
    expect(result.status).toBe(status);
    expect(JSON.parse(result.stdout).route).toBe(route);
  });
  it("preserves legacy REVIEW success and missing-policy fallback", () => {
    const result = cli("review-dependency-change.diff", "--config", join(temp(), "missing.yml"));
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).route).toBe("REVIEW");
  });
  it("requires an explicit existing policy", () => {
    for (const flags of [[], ["--config", join(temp(), "missing.yml")]]) {
      const result = cli("safe-doc-change.diff", "--require-config", ...flags);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Required DiffWall config is missing");
    }
  });
  it("accepts comments on required policy sections and thresholds without losing policy values", () => {
    const config = join(temp(), "policy.yml");
    writeFileSync(config, policy.replace("thresholds:", "thresholds:# comment")
      .replace("review: 40", "review: 60 # deliberately above fixture risk"));
    const result = cli("review-dependency-change.diff", "--require-config", "--config", config);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).thresholds.review).toBe(60);
    expect(JSON.parse(result.stdout).route).toBe("ALLOW");
  });
  it.each([
    "this is not a policy",
    "thresholds:\n  review: 40\n  halt: 75\n",
    policy.replace("review: 40", "review: nope"),
    policy.replace("review: 40", "review: 90"),
    policy + "thresholds:\n  review: 40\n  halt: 75\n",
    policy + "unexpected: true\n",
    policy.replace('  - "docs/**"', '  - "docs/**'),
    policy.replace("ignorePaths:", "ignorePaths: []")
  ])("rejects malformed or incomplete required policy", raw => {
    const config = join(temp(), "policy.yml");
    writeFileSync(config, raw);
    const result = cli("safe-doc-change.diff", "--require-config", "--config", config);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
  });
});

describe("action wrapper", () => {
  function action(config: string, workspace: string) {
    const bash = process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";
    return spawnSync(bash, [resolve("action/entrypoint.sh").replace(/\\/g, "/")], {
      encoding: "utf8", cwd: workspace, env: { ...process.env,
        GITHUB_WORKSPACE: workspace.replace(/\\/g, "/"),
        DIFFWALL_CONFIG: config.replace(/\\/g, "/"),
        DIFFWALL_DIFF: resolve("test/fixtures/review-dependency-change.diff").replace(/\\/g, "/"),
        DIFFWALL_FORMAT: "json", DIFFWALL_REQUIRE_CONFIG: "true", DIFFWALL_FAIL_ON_REVIEW: "true",
        DIFFWALL_COMMENT_TOKEN: "", GITHUB_STEP_SUMMARY: ""
      }
    });
  }
  it("uses separate trusted policy despite a weakened caller policy and retains REVIEW evidence", () => {
    const workspace = temp();
    const trusted = join(temp(), "policy.yml");
    writeFileSync(trusted, policy);
    writeFileSync(join(workspace, "policy.yml"), policy.replace("review: 40", "review: 75"));
    const result = action(trusted, workspace);
    expect(result.error).toBeUndefined();
    expect(result.status, result.stdout + result.stderr).toBe(3);
    expect(JSON.parse(readFileSync(join(workspace, "diffwall-report.json"), "utf8")).route).toBe("REVIEW");
    const evidence = JSON.parse(readFileSync(join(workspace, "diffwall-policy-evidence.json"), "utf8"));
    expect(evidence.policy_sha256).toBe(createHash("sha256").update(policy).digest("hex"));
    expect(evidence.scan_exit_status).toBe(3);
    expect(evidence.policy_checkout_sha).toBeNull(); // Never invent provenance for a standalone file.
  }, 15000);
  it("fails on missing required policy without silently falling back", () => {
    const workspace = temp();
    const result = action(join(workspace, "missing.yml"), workspace);
    expect(result.status, result.stdout + result.stderr).toBe(1);
    expect(result.stdout + result.stderr).toContain("Required DiffWall config is missing");
  }, 15000);
});
