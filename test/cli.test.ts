import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function cli(...args: string[]) {
  return spawnSync(process.execPath, ["dist/cli.js", "scan", ...args], { encoding: "utf8" });
}

describe("CLI policy input failures", () => {
  it("rejects unknown options instead of silently scanning a different input", () => {
    const result = cli("--diff", "test/fixtures/safe-doc-change.diff", "--confg", "strict.yml");
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/unknown option/i);
    expect(result.stdout).not.toContain("ALLOW");
  });

  it("rejects a missing explicitly requested policy", () => {
    const result = cli("--diff", "test/fixtures/safe-doc-change.diff", "--config", "does-not-exist.yml");
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/config.*not found/i);
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
