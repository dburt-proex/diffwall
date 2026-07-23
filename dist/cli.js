#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { loadCodeowners } from "./codeowners.js";
import { loadConfig } from "./config.js";
import { readGitDiff } from "./git.js";
import { toJson } from "./output/json.js";
import { toMarkdown } from "./output/markdown.js";
import { toSarif } from "./output/sarif.js";
import { scanDiff } from "./scanner.js";
const VALID_FORMATS = new Set(["text", "json", "markdown", "sarif"]);
main();
function main() {
    let options;
    try {
        options = parseArgs(process.argv.slice(2));
    }
    catch (error) {
        fail(error);
        return;
    }
    if (options.command !== "scan") {
        printHelp();
        process.exit(options.command ? 1 : 0);
    }
    if (!VALID_FORMATS.has(options.format)) {
        fail(new Error(`Unknown --format "${options.format}" (expected text, json, markdown, or sarif)`));
        return;
    }
    let result;
    try {
        const config = loadConfig(options.config);
        const diff = options.diff ? readFileSync(options.diff, "utf8") : readGitDiff(options);
        const codeowners = loadCodeowners();
        result = scanDiff(diff, config, codeowners);
    }
    catch (error) {
        fail(error);
        return;
    }
    if (options.quiet)
        process.stdout.write(`${result.route}\n`);
    else if (options.format === "json")
        process.stdout.write(toJson(result));
    else if (options.format === "markdown")
        process.stdout.write(toMarkdown(result));
    else if (options.format === "sarif")
        process.stdout.write(toSarif(result));
    else {
        process.stdout.write(`DiffWall: ${result.route}\nRisk score: ${result.score} / 100\n`);
        for (const finding of result.findings)
            process.stdout.write(`  +${finding.score} ${finding.message}\n`);
    }
    if (options.failOnHalt && result.route === "HALT")
        process.exit(2);
}
/** Report an operational error and exit non-zero (distinct from HALT=2). */
function fail(error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`DiffWall error: ${message}\n`);
    process.exit(1);
}
function parseArgs(args) {
    const options = { command: args[0], format: "text" };
    for (let index = 1; index < args.length; index += 1) {
        const arg = args[index];
        const next = args[index + 1];
        if (arg === "--base")
            options.base = takeValue(arg, next, () => index += 1);
        else if (arg === "--head")
            options.head = takeValue(arg, next, () => index += 1);
        else if (arg === "--staged")
            options.staged = true;
        else if (arg === "--diff")
            options.diff = takeValue(arg, next, () => index += 1);
        else if (arg === "--format")
            options.format = takeValue(arg, next, () => index += 1);
        else if (arg === "--config")
            options.config = takeValue(arg, next, () => index += 1);
        else if (arg === "--fail-on-halt")
            options.failOnHalt = true;
        else if (arg === "--quiet")
            options.quiet = true;
        else if (arg === "--help" || arg === "-h")
            options.command = undefined;
    }
    return options;
}
function takeValue(flag, value, bump) {
    if (!value)
        throw new Error(`${flag} requires a value`);
    bump();
    return value;
}
function printHelp() {
    process.stdout.write(`DiffWall — a PR risk firewall for agent-written code.

Usage:
  diffwall scan [options]

Options:
  --base <ref>          Base git ref
  --head <ref>          Head git ref
  --staged              Scan staged changes
  --diff <path>         Scan a unified diff file
  --format <format>     text | json | markdown | sarif
  --config <path>       Path to config file
  --fail-on-halt        Exit 2 when route is HALT
  --quiet               Only print final decision
`);
}
