import { existsSync, readFileSync } from "node:fs";
import type { DiffWallConfig } from "./types.js";

export const defaultConfig: DiffWallConfig = {
  thresholds: { review: 40, halt: 75 },
  ignorePaths: ["docs/**", "*.md"],
  protectedPaths: [
    ".github/workflows/**", "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
    "requirements.txt", "pyproject.toml", "go.mod", "go.sum", "src/auth/**", "src/security/**",
    "auth/**", "security/**", "billing/**", "db/migrations/**", "migrations/**"
  ],
  haltPatterns: ["DROP TABLE", "TRUNCATE TABLE", "rm -rf", "chmod 777", "rejectUnauthorized: false", "verify: false", "verify=False", "NODE_TLS_REJECT_UNAUTHORIZED=0"]
};

export function loadConfig(path?: string): DiffWallConfig {
  if (!path || !existsSync(path)) return defaultConfig;
  const parsed = parseSimpleYaml(readFileSync(path, "utf8"));
  return {
    thresholds: {
      review: Number(parsed.thresholds?.review ?? defaultConfig.thresholds.review),
      halt: Number(parsed.thresholds?.halt ?? defaultConfig.thresholds.halt)
    },
    ignorePaths: parsed.ignorePaths ?? defaultConfig.ignorePaths,
    protectedPaths: parsed.protectedPaths ?? defaultConfig.protectedPaths,
    haltPatterns: parsed.haltPatterns ?? defaultConfig.haltPatterns
  };
}

function parseSimpleYaml(raw: string): Partial<DiffWallConfig> {
  const output: Record<string, unknown> = {};
  let section: string | undefined;
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const sectionMatch = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      output[section] = section === "thresholds" ? {} : [];
      continue;
    }
    const scalarMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (scalarMatch && section === "thresholds") {
      (output.thresholds as Record<string, unknown>)[scalarMatch[1]] = Number(cleanYamlValue(scalarMatch[2]));
      continue;
    }
    if (scalarMatch && !section) {
      output[scalarMatch[1]] = cleanYamlValue(scalarMatch[2]);
      continue;
    }
    const listMatch = line.match(/^-\s*(.+)$/);
    if (listMatch && section && Array.isArray(output[section])) {
      (output[section] as string[]).push(String(cleanYamlValue(listMatch[1])));
    }
  }
  return output as Partial<DiffWallConfig>;
}

function cleanYamlValue(value: string): string | number {
  const cleaned = value.trim().replace(/^["']|["']$/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) && cleaned !== "" ? number : cleaned;
}

export function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "§DOUBLE_STAR§").replace(/\*/g, "[^/]*").replace(/§DOUBLE_STAR§/g, ".*");
  return new RegExp(`^${escaped}$`);
}

export function matchesAny(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => globToRegExp(pattern).test(path));
}
