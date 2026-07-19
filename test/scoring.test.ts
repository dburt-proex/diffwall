import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { defaultConfig } from "../src/config.js";
import { scanDiff } from "../src/scanner.js";

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

describe("DiffWall scoring", () => {
  it("allows ignored docs changes", () => {
    const result = scanDiff(fixture("safe-doc-change.diff"), defaultConfig);
    expect(result.route).toBe("ALLOW");
    expect(result.score).toBe(0);
  });

  it("halts package install scripts", () => {
    const result = scanDiff(fixture("package-lock-change.diff"), defaultConfig);
    expect(result.route).toBe("HALT");
  });

  it("halts destructive migrations", () => {
    const result = scanDiff(fixture("migration-drop-table.diff"), defaultConfig);
    expect(result.route).toBe("HALT");
  });

  it("reviews a benign GitHub Actions workflow change", () => {
    const result = scanDiff(fixture("review-github-actions-workflow-change.diff"), defaultConfig);
    expect(result.route).toBe("REVIEW");
    expect(result.findings.some((f) => f.ruleId.startsWith("github-actions-"))).toBe(false);
  });

  it("halts a pull_request_target workflow that checks out untrusted PR head code", () => {
    const result = scanDiff(fixture("halt-github-actions-pull-request-target.diff"), defaultConfig);
    expect(result.route).toBe("HALT");
    expect(result.findings.some((f) => f.ruleId === "github-actions-pull-request-target-untrusted-checkout")).toBe(true);
    expect(result.findings.some((f) => f.ruleId === "github-actions-untrusted-pr-text-in-shell")).toBe(true);
  });

  it("halts a workflow that exposes secrets too broadly", () => {
    const result = scanDiff(fixture("halt-github-actions-broad-secret-exposure.diff"), defaultConfig);
    expect(result.route).toBe("HALT");
    expect(result.findings.some((f) => f.ruleId === "github-actions-broad-secret-exposure")).toBe(true);
  });
});
