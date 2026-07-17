import { matchOwners, suggestedReviewers, type CodeownersEntry } from "./codeowners.js";
import { matchesAny } from "./config.js";
import { parseUnifiedDiff } from "./git.js";
import { defaultRules } from "./rules/index.js";
import { scoreFindings } from "./scoring.js";
import type { DiffWallConfig, Finding, ScanResult } from "./types.js";

const diffMarker = /(^|\n)(diff --git |--- |\+\+\+ |@@ |[+-])/;

/** True when the input carries diff structure we should have been able to parse. */
function looksLikeDiff(diff: string): boolean {
  return diff.trim().length > 0 && diffMarker.test(diff);
}

export function scanDiff(diff: string, config: DiffWallConfig, codeowners: CodeownersEntry[] = []): ScanResult {
  const parsed = parseUnifiedDiff(diff);
  const files = parsed.filter((file) => !matchesAny(file.path, config.ignorePaths));
  const findings = defaultRules.flatMap((rule) => rule(files, config));

  // Fail safe: content that looks like a diff but parsed into zero files must
  // not be waved through as ALLOW. Surface it and force at least REVIEW.
  if (parsed.length === 0 && looksLikeDiff(diff)) {
    const failSafe: Finding = {
      ruleId: "unparseable-diff",
      severity: "high",
      score: Math.max(config.thresholds.review, 40),
      message: "Diff content was present but no files could be parsed; failing safe to REVIEW"
    };
    findings.push(failSafe);
  }

  const result = scoreFindings(files, findings, config);

  // Route the findings' triggered files through CODEOWNERS to suggest who
  // should review a REVIEW/HALT change. Absent a CODEOWNERS file this is a
  // no-op and yields empty owner data.
  const triggeredFiles = [...new Set(findings.flatMap((finding) => finding.files ?? []))];
  const matches = matchOwners(triggeredFiles, codeowners);
  result.owners = { matches, suggestedReviewers: suggestedReviewers(matches) };

  return result;
}
