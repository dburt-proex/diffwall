import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config.js";
import { toSarif } from "../src/output/sarif.js";
import { scanDiff } from "../src/scanner.js";

describe("toSarif", () => {
  const diff = readFileSync(new URL("./fixtures/auth-bypass.diff", import.meta.url), "utf8");
  const result = scanDiff(diff, defaultConfig);
  const sarif = JSON.parse(toSarif(result));

  it("produces a valid SARIF 2.1.0 envelope", () => {
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.$schema).toContain("sarif-schema-2.1.0.json");
    expect(sarif.runs).toHaveLength(1);
    expect(sarif.runs[0].tool.driver.name).toBe("DiffWall");
  });

  it("includes rule ids and severities for each triggered rule", () => {
    expect(result.findings.length).toBeGreaterThan(0);
    const ruleIds = sarif.runs[0].tool.driver.rules.map((rule: { id: string }) => rule.id);
    for (const finding of result.findings) {
      expect(ruleIds).toContain(finding.ruleId);
    }
    for (const rule of sarif.runs[0].tool.driver.rules) {
      expect(rule.properties.severity).toBeTypeOf("string");
    }
  });

  it("includes a result with matching file location and message for each finding", () => {
    expect(sarif.runs[0].results).toHaveLength(result.findings.length);
    for (const [index, finding] of result.findings.entries()) {
      const sarifResult = sarif.runs[0].results[index];
      expect(sarifResult.ruleId).toBe(finding.ruleId);
      expect(sarifResult.message.text).toBe(finding.message);
      expect(["error", "warning", "note"]).toContain(sarifResult.level);
      expect(sarifResult.locations.length).toBeGreaterThan(0);
      expect(sarifResult.locations[0].physicalLocation.artifactLocation.uri).toBeTypeOf("string");
    }
  });
});
