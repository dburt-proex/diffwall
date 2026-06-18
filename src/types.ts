export type Route = "ALLOW" | "REVIEW" | "HALT";

export type Severity = "low" | "medium" | "high" | "critical";

export interface DiffFile {
  path: string;
  oldPath?: string;
  additions: number;
  deletions: number;
  addedLines: string[];
  removedLines: string[];
  isDeleted: boolean;
  isNew: boolean;
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  score: number;
  message: string;
  files?: string[];
  evidence?: string[];
  halt?: boolean;
}

export interface Thresholds {
  review: number;
  halt: number;
}

export interface DiffWallConfig {
  thresholds: Thresholds;
  ignorePaths: string[];
  protectedPaths: string[];
  haltPatterns: string[];
}

export interface ScanResult {
  route: Route;
  score: number;
  thresholds: Thresholds;
  findings: Finding[];
  halted: boolean;
  summary: {
    filesChanged: number;
    additions: number;
    deletions: number;
    changedFiles: string[];
  };
}

export type Rule = (files: DiffFile[], config: DiffWallConfig) => Finding[];
