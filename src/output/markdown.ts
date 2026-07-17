import type { ScanResult } from "../types.js";

export function toMarkdown(result: ScanResult): string {
  const emoji = result.route === "ALLOW" ? "🟢" : result.route === "REVIEW" ? "🟡" : "🔴";
  const lines = [
    `## ${emoji} DiffWall result: ${result.route}`,
    "",
    `Risk score: \`${result.score} / 100\``,
    "",
    routeMessage(result.route),
    "",
    "### Summary",
    "",
    `- Files changed: \`${result.summary.filesChanged}\``,
    `- Additions: \`${result.summary.additions}\``,
    `- Deletions: \`${result.summary.deletions}\``,
    "",
    "### Triggered rules",
    ""
  ];

  if (result.findings.length === 0) {
    lines.push("No risk rules triggered.", "");
  } else {
    lines.push("| Score | Rule | Severity | Evidence |", "|---:|---|---|---|");
    for (const finding of result.findings) {
      const evidence = [...(finding.files ?? []), ...(finding.evidence ?? [])].slice(0, 4).join("<br>");
      lines.push(`| +${finding.score} | ${finding.message} | ${finding.severity} | ${evidence || "—"} |`);
    }
    lines.push("");
  }

  lines.push("### Route", "", `\`${result.route}\``, "", "### Suggested review focus", "");
  lines.push(...reviewFocus(result));
  lines.push(...ownerSuggestions(result));
  return `${lines.join("\n")}\n`;
}

function routeMessage(route: ScanResult["route"]): string {
  if (route === "ALLOW") return "This PR is low risk under the current policy. Normal CI and review rules still apply.";
  if (route === "REVIEW") return "This PR should receive human review before merging.";
  return "This PR triggered a HALT condition and should not merge until the finding is fixed or explicitly overridden.";
}

function reviewFocus(result: ScanResult): string[] {
  if (result.findings.length === 0) return ["- Standard correctness review"];
  return result.findings.slice(0, 6).map((finding) => `- ${finding.message}`);
}

function ownerSuggestions(result: ScanResult): string[] {
  const { matches, suggestedReviewers } = result.owners;
  if (matches.length === 0) return [];

  const lines = ["", "### Suggested reviewers (CODEOWNERS)", "", `${suggestedReviewers.join(", ")}`, "", "| File | Owners |", "|---|---|"];
  for (const match of matches) lines.push(`| ${match.file} | ${match.owners.join(", ")} |`);
  return lines;
}
