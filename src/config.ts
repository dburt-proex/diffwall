import { existsSync, readFileSync } from "node:fs";
import type { DiffWallConfig } from "./types.js";

export const defaultConfig: DiffWallConfig = {
  thresholds: { review: 40, halt: 75 },
  ignorePaths: ["docs/**", "*.md"],
  protectedPaths: [
    ".github/workflows/**", ".github/agents/**",
    "AGENTS.md", "**/AGENTS.md", "CLAUDE.md", "**/CLAUDE.md", "SKILL.md", "**/SKILL.md",
    ".claude/agents/**", ".claude/skills/**", ".mcp.json", "**/.mcp.json", "mcp.json", "**/mcp.json",
    "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
    "requirements.txt", "pyproject.toml", "go.mod", "go.sum", "src/auth/**", "src/security/**",
    "auth/**", "security/**", "billing/**", "db/migrations/**", "migrations/**"
  ],
  haltPatterns: ["DROP TABLE", "TRUNCATE TABLE", "rm -rf", "chmod 777", "rejectUnauthorized: false", "verify: false", "verify=False", "NODE_TLS_REJECT_UNAUTHORIZED=0"]
};

export function loadConfig(path?: string, required = false): DiffWallConfig {
  if (!path || !existsSync(path)) {
    if (required) throw new Error("Required DiffWall config is missing");
    return defaultConfig;
  }
  const raw = readFileSync(path, "utf8");
  const parsed = required ? parseRequiredPolicy(raw) : parseSimpleYaml(raw);
  const config: DiffWallConfig = {
    thresholds: {
      review: Number(parsed.thresholds?.review ?? defaultConfig.thresholds.review),
      halt: Number(parsed.thresholds?.halt ?? defaultConfig.thresholds.halt)
    },
    ignorePaths: parsed.ignorePaths ?? defaultConfig.ignorePaths,
    protectedPaths: parsed.protectedPaths ?? defaultConfig.protectedPaths,
    haltPatterns: parsed.haltPatterns ?? defaultConfig.haltPatterns
  };
  validateConfig(config, path);
  return config;
}

/** Required policies use the documented block-only subset, with no ignored syntax. */
function parseRequiredPolicy(raw: string): Partial<DiffWallConfig> {
  const sections = new Set(["thresholds", "ignorePaths", "protectedPaths", "haltPatterns"]);
  const seen = new Set<string>();
  const thresholds = new Set<string>();
  let section = "";
  for (const rawLine of raw.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;
    const header = rawLine.match(/^([A-Za-z]+):\s*(?:#.*)?$/);
    if (header) {
      section = header[1];
      if (!sections.has(section) || seen.has(section)) throw new Error("Invalid required policy section");
      seen.add(section);
      continue;
    }
    if (section === "thresholds") {
      const scalar = rawLine.match(/^  (review|halt):\s*(\d+(?:\.\d+)?)\s*(?:#.*)?$/);
      if (!scalar || thresholds.has(scalar[1])) throw new Error("Invalid required policy threshold");
      thresholds.add(scalar[1]);
    } else {
      const item = rawLine.match(/^  - (.+?)\s*$/);
      if (!seen.has(section) || !item) throw new Error("Invalid required policy syntax");
      const value = item[1];
      // Quoted strings have matching quotes; plain strings exclude YAML features.
      const quoted = /^("[^"\r\n]+"|'[^'\r\n]+')$/.test(value);
      const plain = /^[^\s\[\]{}&*!|>"'#][^\[\]{}&!|>"'#]*$/.test(value);
      if (!quoted && !plain) throw new Error("Invalid required policy list value");
    }
  }
  if (seen.size !== sections.size || thresholds.size !== 2) {
    throw new Error("Required policy must explicitly define all four sections and both thresholds");
  }
  // Strip comments accepted on headers/thresholds before passing to the legacy parser.
  return parseSimpleYaml(raw.split(/\r?\n/).map(line =>
    /^\S|^  (review|halt):/.test(line) ? line.replace(/#.*$/, "").trimEnd() : line
  ).join("\n"));
}

/**
 * Reject policy files that would silently misroute changes. An out-of-range or
 * inverted threshold makes a routing tier unreachable, so we fail loudly rather
 * than enforce a broken policy.
 */
export function validateConfig(config: DiffWallConfig, source = "config"): void {
  const { review, halt } = config.thresholds;
  for (const [name, value] of [["review", review], ["halt", halt]] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Invalid DiffWall config (${source}): thresholds.${name} must be a number between 0 and 100, got ${value}`);
    }
  }
  if (halt < review) {
    throw new Error(`Invalid DiffWall config (${source}): thresholds.halt (${halt}) must be >= thresholds.review (${review})`);
  }
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
