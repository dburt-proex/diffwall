import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    resolve("test/fixtures", fixture), "--format", "json", ...flags], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
}
afterEach(() => temporary.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));

describe("CLI enforcement", () => {
  it.each(["--fail-on-reveiw", "--config", "--head"])("rejects invalid flags without swallowing enforcement", flag => {
    const result = cli("review-dependency-change.diff", flag, "--fail-on-review");
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
  });
  it.each([["REVIEW", 100, 3], ["HALT", 40, 2]])("flushes a large piped %s report", (route, halt, status) => {
    const dir = temp();
    const config = join(dir, "policy.yml");
    const diff = join(dir, "large.diff");
    writeFileSync(config, policy.replace("review: 40", "review: 1").replace("halt: 75", `halt: ${halt}`));
    writeFileSync(diff, Array.from({length: 400}, (_, i) => {
      const path = `src/security/${"long-name-".repeat(20)}${i}.ts`;
      return `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -0,0 +1 @@\n+export const guarded = true;\n`;
    }).join("\n"));
    const result = cli("review-dependency-change.diff", "--diff", diff, "--config", config,
      "--require-config", "--fail-on-review", "--fail-on-halt");
    expect(result.status).toBe(status);
    expect(result.stdout.length).toBeGreaterThan(100000);
    const report = JSON.parse(result.stdout);
    expect(report.route).toBe(route);
    expect(report.summary.filesChanged).toBe(400);
  });
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
  function action(config: string, workspace: string, env: NodeJS.ProcessEnv = {}) {
    const bash = process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";
    return spawnSync(bash, [resolve("action/entrypoint.sh").replace(/\\/g, "/")], {
      encoding: "utf8", cwd: workspace, env: { ...process.env,
        GITHUB_WORKSPACE: workspace.replace(/\\/g, "/"),
        DIFFWALL_CONFIG: config.replace(/\\/g, "/"),
        DIFFWALL_DIFF: resolve("test/fixtures/review-dependency-change.diff").replace(/\\/g, "/"),
        DIFFWALL_FORMAT: "json", DIFFWALL_REQUIRE_CONFIG: "true", DIFFWALL_FAIL_ON_REVIEW: "true",
        DIFFWALL_COMMENT_TOKEN: "", GITHUB_STEP_SUMMARY: "", ...env
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
  it("identifies a supplied diff instead of falsely binding it to Git commits", () => {
    const workspace = temp();
    const config = join(workspace, "policy.yml");
    writeFileSync(config, policy);
    const git = (...args: string[]) => {
      const result = spawnSync("git", args, {cwd: workspace, encoding: "utf8"});
      expect(result.status, result.stderr).toBe(0);
      return result.stdout.trim();
    };
    git("init");
    git("add", "policy.yml");
    git("-c", "user.name=DiffWall Test", "-c", "user.email=test@example.invalid", "commit", "-m", "fixture");
    const sha = git("rev-parse", "HEAD");
    const result = action(config, workspace, {DIFFWALL_BASE: sha, DIFFWALL_HEAD: sha});
    expect(result.status).toBe(3);
    const evidence = JSON.parse(readFileSync(join(workspace, "diffwall-policy-evidence.json"), "utf8"));
    expect(evidence.scan_source).toBe("diff-file");
    expect(evidence.base_sha).toBeNull();
    expect(evidence.head_sha).toBeNull();
    expect(evidence.policy_checkout_sha).toBe(sha);
    expect(evidence.diff_sha256).toBe(createHash("sha256").update(
      readFileSync("test/fixtures/review-dependency-change.diff")).digest("hex"));
  }, 15000);
  it("scans exact Git refs against a trusted base checkout despite candidate policy weakening", () => {
    const workspace = temp();
    const git = (...args: string[]) => {
      const result = spawnSync("git", args, {cwd: workspace, encoding: "utf8"});
      expect(result.status, result.stderr).toBe(0);
      return result.stdout.trim();
    };
    git("init");
    writeFileSync(join(workspace, "policy.yml"), policy);
    writeFileSync(join(workspace, "package.json"), '{"dependencies":{}}\n');
    git("add", ".");
    git("-c", "user.name=DiffWall Test", "-c", "user.email=test@example.invalid", "commit", "-m", "base");
    const base = git("rev-parse", "HEAD");
    const trusted = join(workspace, "trusted-policy");
    git("clone", "--no-hardlinks", workspace, trusted);
    writeFileSync(join(workspace, "policy.yml"), policy.replace("review: 40", "review: 75"));
    writeFileSync(join(workspace, "package.json"), '{"dependencies":{"safe-example":"1.0.0"}}\n');
    git("add", "policy.yml", "package.json");
    git("-c", "user.name=DiffWall Test", "-c", "user.email=test@example.invalid", "commit", "-m", "candidate");
    const head = git("rev-parse", "HEAD");
    const result = action(join(trusted, "policy.yml"), workspace,
      {DIFFWALL_DIFF: "", DIFFWALL_BASE: base, DIFFWALL_HEAD: head});
    expect(result.status, result.stdout + result.stderr).toBe(3);
    const report = JSON.parse(readFileSync(join(workspace, "diffwall-report.json"), "utf8"));
    expect(report.route).toBe("REVIEW");
    expect(report.thresholds.review).toBe(40);
    const evidence = JSON.parse(readFileSync(join(workspace, "diffwall-policy-evidence.json"), "utf8"));
    expect(evidence.scan_source).toBe("git-refs");
    expect(evidence.base_sha).toBe(base);
    expect(evidence.head_sha).toBe(head);
    expect(evidence.policy_checkout_sha).toBe(base);
    expect(evidence.diff_sha256).toBeNull();
  }, 15000);
  it("fails when the report cannot be persisted", () => {
    const workspace = temp();
    const config = join(workspace, "policy.yml");
    writeFileSync(config, policy);
    mkdirSync(join(workspace, "diffwall-report.json"));
    const result = action(config, workspace);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain("failed to persist scan report");
    const evidence = JSON.parse(readFileSync(join(workspace, "diffwall-policy-evidence.json"), "utf8"));
    expect(evidence.report_write_exit_status).not.toBe(0);
  }, 15000);
  it("rejects misspelled enforcement booleans", () => {
    const workspace = temp();
    const result = action(resolve("rules/default.yml"), workspace, {DIFFWALL_FAIL_ON_REVIEW: "ture"});
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain("FAIL_ON_REVIEW must be true or false");
  }, 15000);
});
