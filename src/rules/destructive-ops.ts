import type { Rule } from "../types.js";

const destructivePatterns = [
  { id: "drop-table", pattern: /\bDROP\s+TABLE\b/i, message: "Destructive SQL migration detected" },
  { id: "truncate-table", pattern: /\bTRUNCATE\s+TABLE\b/i, message: "Destructive SQL truncation detected" },
  { id: "broad-delete", pattern: /\bDELETE\s+FROM\s+\w+\s*;?\s*$/i, message: "Broad SQL delete detected" },
  { id: "rm-rf", pattern: /\brm\s+-rf\s+(\/|\$|~|\*)/i, message: "Dangerous shell deletion detected" },
  { id: "chmod-777", pattern: /\bchmod\s+777\b/i, message: "Unsafe permission change detected" },
  { id: "tls-disabled", pattern: /rejectUnauthorized\s*:\s*false|verify\s*=\s*False|verify:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0/i, message: "TLS verification disabled" }
];

export const destructiveOpsRule: Rule = (files) => {
  const findings = [];
  for (const detector of destructivePatterns) {
    const hitFiles: string[] = [];
    const evidence: string[] = [];
    for (const file of files) {
      for (const line of file.addedLines) {
        if (detector.pattern.test(line)) {
          hitFiles.push(file.path);
          evidence.push(line.trim());
        }
      }
    }
    if (hitFiles.length > 0) {
      findings.push({ ruleId: detector.id, severity: "critical" as const, score: 100, message: detector.message, files: [...new Set(hitFiles)], evidence: evidence.slice(0, 5), halt: true });
    }
  }
  return findings;
};
