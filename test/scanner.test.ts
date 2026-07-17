import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { scanDiff } from "../src/scanner.js";

describe("scanDiff fail-safe behavior", () => {
  it("does NOT fail open on a header-less diff carrying a destructive change", () => {
    const diff = ["--- a/db/migrations/drop.sql", "+++ b/db/migrations/drop.sql", "@@ -0,0 +1 @@", "+DROP TABLE users;"].join("\n");
    const result = scanDiff(diff, defaultConfig);
    expect(result.route).toBe("HALT");
  });

  it("routes an unparseable-but-diff-like input to at least REVIEW", () => {
    // Diff markers present (@@ / +) but no recoverable file structure.
    const garbage = "@@ garbage @@\n+something dangerous\n";
    const result = scanDiff(garbage, defaultConfig);
    expect(result.summary.filesChanged).toBe(0);
    expect(result.route).not.toBe("ALLOW");
    expect(result.findings.some((f) => f.ruleId === "unparseable-diff")).toBe(true);
  });

  it("keeps a genuinely empty diff as ALLOW", () => {
    const result = scanDiff("", defaultConfig);
    expect(result.route).toBe("ALLOW");
    expect(result.findings).toHaveLength(0);
  });

  it("keeps an ignored docs-only change as ALLOW without a fail-safe finding", () => {
    const diff = ["diff --git a/README.md b/README.md", "--- a/README.md", "+++ b/README.md", "@@ -1 +1,2 @@", "+docs"].join("\n");
    const result = scanDiff(diff, defaultConfig);
    expect(result.route).toBe("ALLOW");
    expect(result.findings.some((f) => f.ruleId === "unparseable-diff")).toBe(false);
  });
});
