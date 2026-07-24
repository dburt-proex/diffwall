import { describe, expect, it } from "vitest";
import { globToRegExp, loadConfig, matchesAny, validateConfig } from "../src/config.js";
import type { DiffWallConfig } from "../src/types.js";

function config(review: number, halt: number): DiffWallConfig {
  return { thresholds: { review, halt }, ignorePaths: [], protectedPaths: [], haltPatterns: [] };
}

describe("validateConfig", () => {
  it("accepts a sane threshold pair", () => {
    expect(() => validateConfig(config(40, 75))).not.toThrow();
  });

  it("rejects an inverted halt/review pair", () => {
    expect(() => validateConfig(config(40, 10))).toThrow(/halt.*must be >=.*review/i);
  });

  it("rejects out-of-range thresholds", () => {
    expect(() => validateConfig(config(-1, 75))).toThrow(/between 0 and 100/i);
    expect(() => validateConfig(config(40, 200))).toThrow(/between 0 and 100/i);
  });

  it("rejects non-numeric thresholds", () => {
    expect(() => validateConfig(config(Number.NaN, 75))).toThrow(/must be a number/i);
  });
});

describe("globToRegExp / matchesAny", () => {
  it("matches ** across directory separators", () => {
    expect(globToRegExp("docs/**").test("docs/a/b.md")).toBe(true);
    expect(globToRegExp("db/migrations/**").test("db/migrations/001.sql")).toBe(true);
  });

  it("keeps single * within a path segment", () => {
    expect(globToRegExp("*.md").test("README.md")).toBe(true);
    expect(globToRegExp("*.md").test("sub/README.md")).toBe(false);
  });

  it("matchesAny returns true when any pattern matches", () => {
    expect(matchesAny("src/auth/session.ts", ["src/auth/**", "docs/**"])).toBe(true);
    expect(matchesAny("src/util.ts", ["src/auth/**"])).toBe(false);
  });

  it("keeps source scanned while excluding compiler-verified dist in self-scan", () => {
    const selfScan = loadConfig("rules/self-scan.yml");

    expect(matchesAny("dist/config.js", selfScan.ignorePaths)).toBe(true);
    expect(matchesAny("src/config.ts", selfScan.ignorePaths)).toBe(false);
    expect(matchesAny(".github/workflows/release-readiness.yml", selfScan.ignorePaths)).toBe(false);
    expect(matchesAny("package.json", selfScan.ignorePaths)).toBe(false);
  });
});
