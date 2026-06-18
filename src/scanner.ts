import { matchesAny } from "./config.js";
import { parseUnifiedDiff } from "./git.js";
import { defaultRules } from "./rules/index.js";
import { scoreFindings } from "./scoring.js";
import type { DiffWallConfig, ScanResult } from "./types.js";

export function scanDiff(diff: string, config: DiffWallConfig): ScanResult {
  const files = parseUnifiedDiff(diff).filter((file) => !matchesAny(file.path, config.ignorePaths));
  const findings = defaultRules.flatMap((rule) => rule(files, config));
  return scoreFindings(files, findings, config);
}
