import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { matchOwners, parseCodeowners, suggestedReviewers } from "../src/codeowners.js";
import { scanDiff } from "../src/scanner.js";

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

describe("CODEOWNERS parsing and matching", () => {
  it("parses patterns and owners, ignoring comments and blank lines", () => {
    const content = ["# comment", "", "*.js @js-team", "/db/migrations/ @db-team @dba"].join("\n");
    const entries = parseCodeowners(content);
    expect(entries).toEqual([
      { pattern: "*.js", owners: ["@js-team"] },
      { pattern: "/db/migrations/", owners: ["@db-team", "@dba"] }
    ]);
  });

  it("matches a directory pattern to nested files", () => {
    const entries = parseCodeowners("/db/migrations/ @db-team");
    const matches = matchOwners(["db/migrations/2024-drop.sql", "src/index.ts"], entries);
    expect(matches).toEqual([{ file: "db/migrations/2024-drop.sql", owners: ["@db-team"] }]);
  });

  it("uses the last matching pattern to win, like git", () => {
    const entries = parseCodeowners(["*.ts @generic-team", "src/auth/*.ts @security-team"].join("\n"));
    const matches = matchOwners(["src/auth/login.ts"], entries);
    expect(matches).toEqual([{ file: "src/auth/login.ts", owners: ["@security-team"] }]);
  });

  it("returns no matches when the file has no owner", () => {
    const entries = parseCodeowners("*.md @docs-team");
    expect(matchOwners(["src/index.ts"], entries)).toEqual([]);
  });

  it("dedupes and sorts suggested reviewers across multiple matches", () => {
    const matches = [
      { file: "a.ts", owners: ["@team-b", "@team-a"] },
      { file: "b.ts", owners: ["@team-a"] }
    ];
    expect(suggestedReviewers(matches)).toEqual(["@team-a", "@team-b"]);
  });

  it("is a no-op when there is no CODEOWNERS ruleset", () => {
    expect(matchOwners(["anything.ts"], [])).toEqual([]);
  });
});

describe("scanDiff CODEOWNERS integration", () => {
  it("attaches owner suggestions for triggered files only", () => {
    const entries = parseCodeowners(["db/migrations/ @db-team", "*.md @docs-team"].join("\n"));
    const result = scanDiff(fixture("migration-drop-table.diff"), defaultConfig, entries);
    expect(result.owners.matches.length).toBeGreaterThan(0);
    expect(result.owners.suggestedReviewers).toContain("@db-team");
    expect(result.owners.suggestedReviewers).not.toContain("@docs-team");
  });

  it("defaults to empty owner data without a CODEOWNERS ruleset", () => {
    const result = scanDiff(fixture("migration-drop-table.diff"), defaultConfig);
    expect(result.owners).toEqual({ matches: [], suggestedReviewers: [] });
  });
});
