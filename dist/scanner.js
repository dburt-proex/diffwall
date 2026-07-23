import { matchOwners, suggestedReviewers } from "./codeowners.js";
import { matchesAny } from "./config.js";
import { parseUnifiedDiff } from "./git.js";
import { defaultRules } from "./rules/index.js";
import { scoreFindings } from "./scoring.js";
const diffMarker = /(^|\n)(diff --git |--- |\+\+\+ |@@ |[+-])/;
/** True when the input carries diff structure we should have been able to parse. */
function looksLikeDiff(diff) {
    return diff.trim().length > 0 && diffMarker.test(diff);
}
export function scanDiff(diff, config, codeowners = []) {
    const parsed = parseUnifiedDiff(diff);
    const files = parsed.filter((file) => !matchesAny(file.path, config.ignorePaths));
    const findings = defaultRules.flatMap((rule) => rule(files, config));
    if (parsed.length === 0 && looksLikeDiff(diff)) {
        const failSafe = {
            ruleId: "unparseable-diff",
            severity: "high",
            score: Math.max(config.thresholds.review, 40),
            message: "Diff content was present but no files could be parsed; failing safe to REVIEW"
        };
        findings.push(failSafe);
    }
    const result = scoreFindings(files, findings, config);
    const triggeredFiles = [...new Set(findings.flatMap((finding) => finding.files ?? []))];
    const matches = matchOwners(triggeredFiles, codeowners);
    result.owners = { matches, suggestedReviewers: suggestedReviewers(matches) };
    return result;
}
