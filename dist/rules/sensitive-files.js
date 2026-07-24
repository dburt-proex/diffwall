import { matchesAny } from "../config.js";
export const sensitiveFilesRule = (files, config) => {
    const findings = [];
    const protectedFiles = files.map((file) => file.path).filter((path) => matchesAny(path, config.protectedPaths));
    if (protectedFiles.length > 0) {
        findings.push({
            ruleId: "protected-path-change",
            severity: "medium",
            score: 20,
            message: "Protected or high-impact files changed",
            files: protectedFiles
        });
    }
    const workflowFiles = files.map((file) => file.path).filter((path) => path.startsWith(".github/workflows/"));
    if (workflowFiles.length > 0) {
        findings.push({
            ruleId: "github-workflow-change",
            severity: "high",
            score: 25,
            message: "GitHub Actions workflow changed",
            files: workflowFiles
        });
    }
    return findings;
};
