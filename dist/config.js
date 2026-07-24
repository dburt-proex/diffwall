import { existsSync, readFileSync } from "node:fs";
export const defaultConfig = {
    thresholds: { review: 40, halt: 75 },
    ignorePaths: ["docs/**", "*.md"],
    protectedPaths: [
        ".github/workflows/**", "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
        "requirements.txt", "pyproject.toml", "go.mod", "go.sum", "src/auth/**", "src/security/**",
        "auth/**", "security/**", "billing/**", "db/migrations/**", "migrations/**"
    ],
    haltPatterns: ["DROP TABLE", "TRUNCATE TABLE", "rm -rf", "chmod 777", "rejectUnauthorized: false", "verify: false", "verify=False", "NODE_TLS_REJECT_UNAUTHORIZED=0"]
};
export function loadConfig(path) {
    if (!path || !existsSync(path))
        return defaultConfig;
    const parsed = parseSimpleYaml(readFileSync(path, "utf8"));
    const config = {
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
/**
 * Reject policy files that would silently misroute changes. An out-of-range or
 * inverted threshold makes a routing tier unreachable, so we fail loudly rather
 * than enforce a broken policy.
 */
export function validateConfig(config, source = "config") {
    const { review, halt } = config.thresholds;
    for (const [name, value] of [["review", review], ["halt", halt]]) {
        if (!Number.isFinite(value) || value < 0 || value > 100) {
            throw new Error(`Invalid DiffWall config (${source}): thresholds.${name} must be a number between 0 and 100, got ${value}`);
        }
    }
    if (halt < review) {
        throw new Error(`Invalid DiffWall config (${source}): thresholds.halt (${halt}) must be >= thresholds.review (${review})`);
    }
}
function parseSimpleYaml(raw) {
    const output = {};
    let section;
    for (const rawLine of raw.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#"))
            continue;
        const sectionMatch = line.match(/^([A-Za-z0-9_-]+):\s*$/);
        if (sectionMatch) {
            section = sectionMatch[1];
            output[section] = section === "thresholds" ? {} : [];
            continue;
        }
        const scalarMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
        if (scalarMatch && section === "thresholds") {
            output.thresholds[scalarMatch[1]] = Number(cleanYamlValue(scalarMatch[2]));
            continue;
        }
        if (scalarMatch && !section) {
            output[scalarMatch[1]] = cleanYamlValue(scalarMatch[2]);
            continue;
        }
        const listMatch = line.match(/^-\s*(.+)$/);
        if (listMatch && section && Array.isArray(output[section])) {
            output[section].push(String(cleanYamlValue(listMatch[1])));
        }
    }
    return output;
}
function cleanYamlValue(value) {
    const cleaned = value.trim().replace(/^["']|["']$/g, "");
    const number = Number(cleaned);
    return Number.isFinite(number) && cleaned !== "" ? number : cleaned;
}
export function globToRegExp(pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "§DOUBLE_STAR§").replace(/\*/g, "[^/]*").replace(/§DOUBLE_STAR§/g, ".*");
    return new RegExp(`^${escaped}$`);
}
export function matchesAny(path, patterns) {
    return patterns.some((pattern) => globToRegExp(pattern).test(path));
}
