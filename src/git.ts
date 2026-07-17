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

  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
}

function emptyFile(path: string, oldPath?: string): DiffFile {
  return { path, oldPath, additions: 0, deletions: 0, addedLines: [], removedLines: [], isDeleted: false, isNew: false };
}

/**
 * Normalise a path taken from a `---`/`+++` marker: drop the trailing
 * tab-delimited timestamp emitted by `diff -u`, strip surrounding quotes, and
 * remove the leading `a/` or `b/` prefix that git uses.
 */
function normalizeMarkerPath(raw: string): string {
  let path = raw.split("\t")[0].trim();
  path = path.replace(/^"(.*)"$/, "$1");
  if (path === "/dev/null") return path;
  if (path.startsWith("a/") || path.startsWith("b/")) path = path.slice(2);
  return path;
}

/**
 * Parse a unified diff into per-file summaries.
 *
 * Handles both `git diff` output (with `diff --git` headers) and header-less
 * unified diffs produced by `diff -u`, `svn diff`, or saved patch files. A
 * firewall must never silently ignore content it cannot attribute to a file,
 * so file boundaries are recognised from either the git header or a bare
 * `---`/`+++` marker pair.
 */
export function parseUnifiedDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diff.split(/\r?\n/);
  let current: DiffFile | undefined;
  let currentHasHeader = false;

  const startFile = (path: string, oldPath?: string): void => {
    current = emptyFile(path, oldPath);
    files.push(current);
    currentHasHeader = false;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      const oldPath = match?.[1];
      const path = match?.[2] ?? oldPath ?? "unknown";
      startFile(path, oldPath);
      continue;
    }

    // A real file header is the adjacent marker pair `--- old` then `+++ new`.
    // Requiring adjacency disambiguates it from added/removed content lines
    // that merely begin with `---`/`+++` (e.g. a SQL `-- comment` or a source
    // line starting with `+ `), which a firewall must not misparse away.
    if (line.startsWith("--- ") && lines[index + 1]?.startsWith("+++ ")) {
      const oldPath = normalizeMarkerPath(line.slice("--- ".length));
      const newPath = normalizeMarkerPath(lines[index + 1].slice("+++ ".length));
      const resolvedOld = oldPath === "/dev/null" ? undefined : oldPath;
      const resolvedNew = newPath === "/dev/null" ? undefined : newPath;

      if (current && !currentHasHeader) {
        // git-header case: enrich the file already opened by `diff --git`.
        if (resolvedOld) current.oldPath = resolvedOld;
        if (resolvedNew) current.path = resolvedNew;
        currentHasHeader = true;
      } else {
        // header-less diff (diff -u / svn / saved patch): the pair opens a file.
        startFile(resolvedNew ?? resolvedOld ?? "unknown", resolvedOld);
        currentHasHeader = true;
      }
      if (oldPath === "/dev/null") current!.isNew = true;
      if (newPath === "/dev/null") current!.isDeleted = true;
      index += 1; // consume the `+++` line
      continue;
    }

    if (!current) continue;

    if (line.startsWith("new file mode")) current.isNew = true;
    else if (line.startsWith("deleted file mode")) current.isDeleted = true;
    else if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions += 1;
      current.addedLines.push(line.slice(1));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions += 1;
      current.removedLines.push(line.slice(1));
    }
  }

  return files.filter((file) => file.path !== "/dev/null" && (file.path !== "unknown" || file.additions > 0 || file.deletions > 0));
}
