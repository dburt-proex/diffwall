/**
 * Enforce literal halt patterns supplied by the active policy pack.
 *
 * Pattern matching is case-insensitive so policy authors do not need to list
 * every casing variant. Empty patterns are ignored because every string
 * contains an empty substring.
 */
export const configuredHaltPatternsRule = (files, config) => {
    const hitFiles = [];
    const matchedPatterns = [];
    const patterns = config.haltPatterns
        .map((pattern) => ({ pattern, normalized: pattern.trim().toLowerCase() }))
        .filter(({ normalized }) => normalized.length > 0);
    for (const file of files) {
        for (const line of file.addedLines) {
            const normalizedLine = line.toLowerCase();
            for (const { pattern, normalized } of patterns) {
                if (normalizedLine.includes(normalized)) {
                    hitFiles.push(file.path);
                    matchedPatterns.push(pattern);
                }
            }
        }
    }
    if (hitFiles.length === 0)
        return [];
    return [{
            ruleId: "configured-halt-pattern",
            severity: "critical",
            score: 100,
            message: "Configured halt pattern added",
            files: [...new Set(hitFiles)],
            evidence: [...new Set(matchedPatterns)].slice(0, 5),
            halt: true
        }];
};
