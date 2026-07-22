import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defaultConfig, loadConfig } from "../src/config.js";
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

  it("reviews a Python/Django dependency manifest change under the python-django policy pack", () => {
    const config = loadConfig(fileURLToPath(new URL("../policy-packs/python-django.yml", import.meta.url)));
    const result = scanDiff(fixture("python-django-review-requirements.diff"), config);
    expect(result.route).toBe("REVIEW");
  });

  it("halts a destructive Django migration under the python-django policy pack", () => {
    const config = loadConfig(fileURLToPath(new URL("../policy-packs/python-django.yml", import.meta.url)));
    const result = scanDiff(fixture("python-django-halt-migration.diff"), config);
    expect(result.route).toBe("HALT");
  });

  it("halts a Django-specific configured halt pattern", () => {
    const config = loadConfig(fileURLToPath(new URL("../policy-packs/python-django.yml", import.meta.url)));
    const result = scanDiff(fixture("python-django-halt-debug.diff"), config);
    expect(result.route).toBe("HALT");
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "configured-halt-pattern", halt: true })
    ]));
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
