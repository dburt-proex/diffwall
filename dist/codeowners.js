import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
/**
 * GitHub looks for CODEOWNERS in these locations, in this order.
 * See https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
 */
const CODEOWNERS_LOCATIONS = [".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS"];
/** Find and parse the first CODEOWNERS file present, or return an empty ruleset. */
export function loadCodeowners(cwd = process.cwd()) {
    for (const relativePath of CODEOWNERS_LOCATIONS) {
        const fullPath = join(cwd, relativePath);
        if (existsSync(fullPath))
            return parseCodeowners(readFileSync(fullPath, "utf8"));
    }
    return [];
}
export function parseCodeowners(content) {
    const entries = [];
    for (const rawLine of content.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#"))
            continue;
        const [pattern, ...owners] = line.split(/\s+/);
        entries.push({ pattern, owners });
    }
    return entries;
}
/**
 * Resolve the owners for a single file path using CODEOWNERS semantics: the
 * last matching pattern in the file wins, and a pattern with no owners
 * explicitly clears any previously matched owners.
 */
export function ownersForFile(filePath, entries) {
    let owners = [];
    for (const entry of entries) {
        if (patternToRegExp(entry.pattern).test(filePath))
            owners = entry.owners;
    }
    return owners;
}
/** Map each of the given files to its CODEOWNERS owners, skipping files with none. */
export function matchOwners(files, entries) {
    if (entries.length === 0)
        return [];
    const matches = [];
    for (const file of files) {
        const owners = ownersForFile(file, entries);
        if (owners.length > 0)
            matches.push({ file, owners });
    }
    return matches;
}
/** Deduplicated, sorted list of every owner referenced by a set of matches. */
export function suggestedReviewers(matches) {
    const owners = new Set();
    for (const match of matches) {
        for (const owner of match.owners)
            owners.add(owner);
    }
    return [...owners].sort();
}
/**
 * Translate a CODEOWNERS pattern (gitignore-style syntax) into a RegExp.
 *
 * A pattern containing a `/` anywhere but the end is anchored to the repo
 * root; otherwise it matches at any depth. A trailing `/` matches everything
 * under that directory.
 */
function patternToRegExp(pattern) {
    let normalized = pattern.startsWith("/") ? pattern.slice(1) : pattern;
    const withoutTrailingSlash = pattern.endsWith("/") ? pattern.slice(0, -1) : pattern;
    const anchored = pattern.startsWith("/") || withoutTrailingSlash.includes("/");
    if (normalized.endsWith("/"))
        normalized += "**";
    const regexBody = normalized
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "\u0000")
        .replace(/\*/g, "[^/]*")
        .replace(/\u0000/g, ".*")
        .replace(/\?/g, ".");
    return new RegExp(anchored ? `^${regexBody}$` : `^(.*/)?${regexBody}$`);
}
