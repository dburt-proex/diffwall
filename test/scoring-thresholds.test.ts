import { describe, expect, it } from "vitest";
import { scoreFindings } from "../src/scoring.js";
import type { DiffFile, DiffWallConfig, Finding } from "../src/types.js";

const config: DiffWallConfig = {
  thresholds: { review: 40, halt: 75 },
  ignorePaths: [],
  protectedPaths: [],
  haltPatterns: []
};

function file(path = "src/example.ts", additions = 1, deletions = 0): DiffFile {
  return {
    path,
    additions,
    deletions,
    addedLines: [],
    removedLines: [],
    isDeleted: false,
    isNew: false
  };
}

function finding(score: number, halt = false): Finding {
  return {
    ruleId: `test-score-${score}`,
    severity: halt ? "critical" : "medium",
    score,
    message: `Synthetic finding worth ${score}`,
    halt
  };
}

describe("scoreFindings threshold routing", () => {
  it("routes ALLOW when score is below the review threshold", () => {
    const result = scoreFindings([file()], [finding(39)], config);

    expect(result.route).toBe("ALLOW");
    expect(result.score).toBe(39);
    expect(result.halted).toBe(false);
  });

  it("routes REVIEW at the review threshold", () => {
    const result = scoreFindings([file()], [finding(40)], config);

    expect(result.route).toBe("REVIEW");
    expect(result.score).toBe(40);
    expect(result.halted).toBe(false);
  });

  it("routes HALT at the halt threshold", () => {
    const result = scoreFindings([file()], [finding(75)], config);

    expect(result.route).toBe("HALT");
    expect(result.score).toBe(75);
    expect(result.halted).toBe(true);
  });

  it("routes HALT when any finding has halt=true even with a low score", () => {
    const result = scoreFindings([file()], [finding(5, true)], config);

    expect(result.route).toBe("HALT");
    expect(result.score).toBe(5);
    expect(result.halted).toBe(true);
  });

  it("caps summed score at 100 and preserves summary metadata", () => {
    const result = scoreFindings([
      file("src/a.ts", 3, 1),
      file("src/b.ts", 2, 4)
    ], [finding(60), finding(60)], config);

    expect(result.route).toBe("HALT");
    expect(result.score).toBe(100);
    expect(result.summary).toEqual({
      filesChanged: 2,
      additions: 5,
      deletions: 5,
      changedFiles: ["src/a.ts", "src/b.ts"]
    });
  });
});
