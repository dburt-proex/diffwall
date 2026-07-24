const sourceFile = /\.(ts|tsx|js|jsx|py|go|rs|java|kt|rb|php|cs|cpp|c|h)$/;
const testFile = /(^|\/)(__tests__|tests?|spec)(\/|$)|\.(test|spec)\./;
export const generatedCodeSizeRule = (files) => {
    const findings = [];
    const additions = files.reduce((sum, file) => sum + file.additions, 0);
    const deletions = files.reduce((sum, file) => sum + file.deletions, 0);
    const changed = additions + deletions;
    if (changed > 1500)
        findings.push({ ruleId: "huge-diff", severity: "high", score: 30, message: "Huge diff size", evidence: [`${changed} changed lines`] });
    else if (changed > 500)
        findings.push({ ruleId: "large-diff", severity: "medium", score: 15, message: "Large diff size", evidence: [`${changed} changed lines`] });
    else if (changed > 150)
        findings.push({ ruleId: "medium-diff", severity: "low", score: 3, message: "Medium diff size", evidence: [`${changed} changed lines`] });
    const sourceChanged = files.some((file) => sourceFile.test(file.path) && !testFile.test(file.path));
    const testsChanged = files.some((file) => testFile.test(file.path));
    if (sourceChanged && !testsChanged)
        findings.push({ ruleId: "source-without-tests", severity: "low", score: 10, message: "Source changed without test changes" });
    const deletedTests = files.filter((file) => testFile.test(file.path) && file.deletions > file.additions).map((file) => file.path);
    if (deletedTests.length > 0)
        findings.push({ ruleId: "tests-removed", severity: "medium", score: 20, message: "Test files or assertions appear to be removed", files: deletedTests });
    return findings;
};
