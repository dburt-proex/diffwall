import type { DiffWallConfig, Finding, Route, ScanResult, DiffFile } from "./types.js";

export function scoreFindings(files: DiffFile[], findings: Finding[], config: DiffWallConfig): ScanResult {
  const rawScore = findings.reduce((sum, finding) => sum + finding.score, 0);
  const score = Math.min(100, rawScore);
  const halted = findings.some((finding) => finding.halt) || score >= config.thresholds.halt;
  const route: Route = halted ? "HALT" : score >= config.thresholds.review ? "REVIEW" : "ALLOW";

  return {
    route,
    score,
    thresholds: config.thresholds,
    findings,
    halted,
    summary: {
      filesChanged: files.length,
      additions: files.reduce((sum, file) => sum + file.additions, 0),
      deletions: files.reduce((sum, file) => sum + file.deletions, 0),
      changedFiles: files.map((file) => file.path)
    },
    owners: { matches: [], suggestedReviewers: [] }
  };
}
