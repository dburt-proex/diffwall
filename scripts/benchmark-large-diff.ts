import { performance } from "node:perf_hooks";

import { defaultConfig } from "../src/config.js";
import { scanDiff } from "../src/scanner.js";

const FILE_COUNT = 750;
const LINES_PER_FILE = 12;
const RUNS = 3;
const MAX_DURATION_MS = 5_000;

function makeLargeDiff(): string {
  const chunks: string[] = [];

  for (let fileIndex = 0; fileIndex < FILE_COUNT; fileIndex += 1) {
    const path = `src/generated/module-${fileIndex}.ts`;
    chunks.push(`diff --git a/${path} b/${path}`);
    chunks.push("new file mode 100644");
    chunks.push("--- /dev/null");
    chunks.push(`+++ b/${path}`);
    chunks.push(`@@ -0,0 +1,${LINES_PER_FILE} @@`);

    for (let lineIndex = 0; lineIndex < LINES_PER_FILE; lineIndex += 1) {
      chunks.push(`+export const value_${fileIndex}_${lineIndex} = ${fileIndex + lineIndex};`);
    }
  }

  return `${chunks.join("\n")}\n`;
}

const diff = makeLargeDiff();
const durations: number[] = [];
const routes: string[] = [];
let summary: ReturnType<typeof scanDiff>["summary"] | undefined;

for (let run = 0; run < RUNS; run += 1) {
  const startedAt = performance.now();
  const result = scanDiff(diff, defaultConfig);
  durations.push(performance.now() - startedAt);
  routes.push(result.route);
  summary = result.summary;

  if (result.summary.filesChanged !== FILE_COUNT) {
    throw new Error(
      `large-diff benchmark parsed ${result.summary.filesChanged} files; expected ${FILE_COUNT}`
    );
  }
}

if (new Set(routes).size !== 1) {
  throw new Error(`large-diff benchmark was not deterministic: ${routes.join(", ")}`);
}

const maximumMs = Math.max(...durations);
if (maximumMs > MAX_DURATION_MS) {
  throw new Error(
    `large-diff benchmark exceeded ${MAX_DURATION_MS} ms: ${maximumMs.toFixed(2)} ms`
  );
}

process.stdout.write(
  `${JSON.stringify(
    {
      fixture: {
        files: FILE_COUNT,
        addedLines: FILE_COUNT * LINES_PER_FILE,
        bytes: Buffer.byteLength(diff, "utf8")
      },
      runs: RUNS,
      route: routes[0],
      durationsMs: durations.map((duration) => Number(duration.toFixed(2))),
      maximumMs: Number(maximumMs.toFixed(2)),
      thresholdMs: MAX_DURATION_MS,
      summary
    },
    null,
    2
  )}\n`
);
