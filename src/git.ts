import { execFileSync } from "node:child_process";
import type { DiffFile } from "./types.js";

export interface DiffOptions {
  base?: string;
  head?: string;
  staged?: boolean;
}

export function readGitDiff(options: DiffOptions): string {
  const args = ["diff", "--no-ext-diff", "--unified=0"];

  if (options.staged) {
    args.push("--staged");
  } else if (options.base && options.head) {
    args.push(options.base, options.head);
  } else if (options.base) {
    args.push(options.base);
  }

  return execFileSync("git", args, { encoding: "utf8" });
}

export function parseUnifiedDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: DiffFile | undefined;

  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      const oldPath = match?.[1];
      const path = match?.[2] ?? oldPath ?? "unknown";
      current = { path, oldPath, additions: 0, deletions: 0, addedLines: [], removedLines: [], isDeleted: false, isNew: false };
      files.push(current);
      continue;
    }

    if (!current) continue;
    if (line.startsWith("new file mode")) current.isNew = true;
    if (line.startsWith("deleted file mode")) current.isDeleted = true;
    if (line.startsWith("+++ b/")) current.path = line.slice("+++ b/".length);
    if (line.startsWith("--- a/")) current.oldPath = line.slice("--- a/".length);

    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions += 1;
      current.addedLines.push(line.slice(1));
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions += 1;
      current.removedLines.push(line.slice(1));
    }
  }

  return files.filter((file) => file.path !== "/dev/null");
}
