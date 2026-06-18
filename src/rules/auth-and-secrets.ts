import type { Rule } from "../types.js";

const authPathPattern = /(^|\/)(auth|security|session|jwt|oauth|billing|permissions?)(\/|\.|-|_)/i;
const secretPatterns = [
  /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /\b(AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/,
  /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][^"']{12,}["']/i
];

export const authAndSecretsRule: Rule = (files) => {
  const findings = [];
  const authFiles = files.map((file) => file.path).filter((path) => authPathPattern.test(path));

  if (authFiles.length > 0) {
    findings.push({ ruleId: "auth-sensitive-path", severity: "high" as const, score: 25, message: "Authentication, authorization, billing, or security-sensitive files changed", files: authFiles });
  }

  const secretEvidence: string[] = [];
  const secretFiles: string[] = [];
  for (const file of files) {
    for (const line of file.addedLines) {
      if (secretPatterns.some((pattern) => pattern.test(line))) {
        secretFiles.push(file.path);
        secretEvidence.push(redact(line));
      }
    }
  }

  if (secretEvidence.length > 0) {
    findings.push({ ruleId: "secret-like-string-added", severity: "critical" as const, score: 100, message: "Secret-like credential or private key added", files: [...new Set(secretFiles)], evidence: secretEvidence.slice(0, 5), halt: true });
  }

  return findings;
};

function redact(line: string): string {
  if (line.length <= 24) return "[redacted]";
  return `${line.slice(0, 12)}…[redacted]`;
}
