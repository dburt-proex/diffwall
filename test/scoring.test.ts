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
});
