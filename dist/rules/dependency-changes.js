const dependencyFiles = /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lock|requirements\.txt|pyproject\.toml|poetry\.lock|Pipfile\.lock|go\.mod|go\.sum|Cargo\.toml|Cargo\.lock|Gemfile|Gemfile\.lock)$/;
const installScriptPattern = /"(preinstall|install|postinstall|prepare)"\s*:/;
export const dependencyChangesRule = (files) => {
    const findings = [];
    const changed = files.map((file) => file.path).filter((path) => dependencyFiles.test(path));
    if (changed.length > 0) {
        findings.push({ ruleId: "dependency-manifest-change", severity: "medium", score: 20, message: "Dependency manifest or lockfile changed", files: changed });
    }
    const scriptFiles = files.filter((file) => dependencyFiles.test(file.path)).filter((file) => file.addedLines.some((line) => installScriptPattern.test(line))).map((file) => file.path);
    if (scriptFiles.length > 0) {
        findings.push({ ruleId: "install-script-added", severity: "critical", score: 100, message: "Package install lifecycle script added or modified", files: scriptFiles, halt: true });
    }
    return findings;
};
