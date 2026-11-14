import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function cli(...args: string[]) {
  return spawnSync(process.execPath, ["dist/cli.js", "scan", ...args], { encoding: "utf8" });
}

describe("CLI policy input failures", () => {
  it("executes the comment entrypoint on every supported platform", () => {
    const env = { ...process.env };
    delete env.DIFFWALL_REPORT_PATH;
    const result = spawnSync(process.execPath, ["dist/github-comment.js"], { encoding: "utf8", env });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Skipping PR comment update: DIFFWALL_REPORT_PATH is not set/);
  });

  it("rejects unknown options instead of silently scanning a different input", () => {
    const result = cli("--diff", "test/fixtures/safe-doc-change.diff", "--confg", "strict.yml");
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/unknown option/i);
    expect(result.stdout).not.toContain("ALLOW");
  });

  it("rejects a missing explicitly required policy", () => {
    const result = cli("--diff", "test/fixtures/safe-doc-change.diff", "--config", "does-not-exist.yml", "--require-config");
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/required.*config.*missing/i);
    expect(result.stdout).not.toContain("ALLOW");
  });

  it("does not consume an option as another option's value", () => {
    const result = cli("--diff", "--quiet");
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/requires a value/i);
  });

  it("rejects conflicting diff sources", () => {
    const result = cli("--diff", "test/fixtures/safe-doc-change.diff", "--staged");
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/cannot combine/i);
  });

  it("rejects a head ref without a base", () => {
    const result = cli("--head", "HEAD");
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/requires --base/i);
  });
});
