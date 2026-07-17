import type { Finding, ScanResult, Severity } from "../types.js";

const SARIF_SCHEMA = "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json";

/** Maps DiffWall severities onto the SARIF result.level vocabulary. */
function toSarifLevel(severity: Severity): "error" | "warning" | "note" {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium") return "warning";
  return "note";
}

function toRule(finding: Finding): Record<string, unknown> {
  return {
    id: finding.ruleId,
    shortDescription: { text: finding.message },
    properties: { severity: finding.severity }
  };
}

function toLocations(finding: Finding, fallbackFiles: string[]): Array<Record<string, unknown>> {
  const files = finding.files && finding.files.length > 0 ? finding.files : fallbackFiles;
  if (files.length === 0) {
    return [{ physicalLocation: { artifactLocation: { uri: "." } } }];
  }
  return files.map((path) => ({
    physicalLocation: {
      artifactLocation: { uri: path },
      region: { startLine: 1 }
    }
  }));
}

function toResult(finding: Finding, fallbackFiles: string[]): Record<string, unknown> {
  return {
    ruleId: finding.ruleId,
    level: toSarifLevel(finding.severity),
    message: { text: finding.message },
    locations: toLocations(finding, fallbackFiles)
  };
}

export function toSarif(result: ScanResult): string {
  const rules = new Map<string, Record<string, unknown>>();
  for (const finding of result.findings) {
    if (!rules.has(finding.ruleId)) rules.set(finding.ruleId, toRule(finding));
  }

  const sarif = {
    $schema: SARIF_SCHEMA,
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "DiffWall",
            informationUri: "https://github.com/dburt-proex/diffwall",
            rules: [...rules.values()]
          }
        },
        results: result.findings.map((finding) => toResult(finding, result.summary.changedFiles))
      }
    ]
  };

  return `${JSON.stringify(sarif, null, 2)}\n`;
}
