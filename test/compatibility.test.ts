import { describe, expect, it } from "vitest";

import { defaultConfig } from "../src/config.js";
import { scanDiff } from "../src/scanner.js";
import type { DiffWallConfig } from "../src/types.js";

const monorepoConfig: DiffWallConfig = {
  ...defaultConfig,
  ignorePaths: ["docs/**", "**/*.md"],
  protectedPaths: [
    ...defaultConfig.protectedPaths,
    "apps/*/src/auth/**",
    "services/*/migrations/**",
    "packages/*/package.json"
  ]
};

function fileDiff(path: string, addedLine: string, lineEnding = "\n"): string {
  return [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ b/${path}`,
    "@@ -1 +1,2 @@",
    `+${addedLine}`,
    ""
  ].join(lineEnding);
}

describe("repository compatibility", () => {
  it("applies repository-local policy to nested monorepo auth and package paths", () => {
    const diff = [
      fileDiff("apps/api/src/auth/session.ts", "export const rotateSession = true;"),
      fileDiff("packages/web/package.json", '  "dependency": "1.0.0"')
    ].join("\n");

    const result = scanDiff(diff, monorepoConfig);
    const protectedFinding = result.findings.find(
      (finding) => finding.ruleId === "protected-path-change"
    );

    expect(protectedFinding?.files).toEqual(
      expect.arrayContaining([
        "apps/api/src/auth/session.ts",
        "packages/web/package.json"
      ])
    );
    expect(result.route).not.toBe("ALLOW");
  });

  it("parses CRLF diffs from Windows-oriented repositories without failing open", () => {
    const diff = fileDiff(
      "services/accounts/migrations/0002.sql",
      "ALTER TABLE users ADD COLUMN governed INTEGER;",
      "\r\n"
    );

    const result = scanDiff(diff, monorepoConfig);

    expect(result.summary.changedFiles).toContain(
      "services/accounts/migrations/0002.sql"
    );
    expect(
      result.findings.some((finding) => finding.ruleId === "protected-path-change")
    ).toBe(true);
    expect(result.route).not.toBe("ALLOW");
  });

  it("keeps nested documentation ignored when repository policy excludes it", () => {
    const diff = fileDiff(
      "docs/platform/agent-governance.md",
      "documentation-only change"
    );

    const result = scanDiff(diff, monorepoConfig);

    expect(result.route).toBe("ALLOW");
    expect(result.summary.filesChanged).toBe(0);
  });
});
