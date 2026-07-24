const workflowPath = /^\.github\/workflows\/[^/]+\.(ya?ml)$/;
const pullRequestTarget = /^\s*pull_request_target\s*:/m;
const checkoutAction = /uses:\s*actions\/checkout@/;
const untrustedHeadRef = /github\.event\.pull_request\.head\.(sha|ref|repo\.full_name)|github\.head_ref/;
const untrustedPrText = /github\.event\.pull_request\.(title|body)/;
const shellCommand = /^\s*(run|script):\s*(\||>|.*\$\{\{)/m;
const broadSecretExposure = /secrets:\s*inherit|toJson\(secrets\)|\$\{\{\s*secrets\s*\}\}/;
export const githubActionsRule = (files) => {
    const findings = [];
    for (const file of files.filter((candidate) => workflowPath.test(candidate.path))) {
        const added = file.addedLines.join("\n");
        const evidence = [];
        if (untrustedPrText.test(added) && shellCommand.test(added)) {
            evidence.push(...matchingLines(file.addedLines, [untrustedPrText, shellCommand]));
            findings.push({
                ruleId: "github-actions-untrusted-pr-text-in-shell",
                severity: "high",
                score: 35,
                message: "GitHub Actions workflow uses untrusted PR title/body near shell execution",
                files: [file.path],
                evidence: unique(evidence).slice(0, 5)
            });
        }
        if (pullRequestTarget.test(added) && checkoutAction.test(added) && untrustedHeadRef.test(added)) {
            findings.push({
                ruleId: "github-actions-pull-request-target-untrusted-checkout",
                severity: "critical",
                score: 100,
                message: "pull_request_target workflow checks out untrusted PR head code",
                files: [file.path],
                evidence: matchingLines(file.addedLines, [pullRequestTarget, checkoutAction, untrustedHeadRef]).slice(0, 5),
                halt: true
            });
        }
        if (broadSecretExposure.test(added)) {
            findings.push({
                ruleId: "github-actions-broad-secret-exposure",
                severity: "critical",
                score: 100,
                message: "GitHub Actions workflow exposes secrets too broadly",
                files: [file.path],
                evidence: matchingLines(file.addedLines, [broadSecretExposure]).slice(0, 5),
                halt: true
            });
        }
    }
    return findings;
};
function matchingLines(lines, patterns) {
    return lines.filter((line) => patterns.some((pattern) => pattern.test(line))).map((line) => line.trim());
}
function unique(values) {
    return [...new Set(values)];
}
