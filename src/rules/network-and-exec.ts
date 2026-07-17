import type { Rule } from "../types.js";

const dynamicExec = /\b(eval|Function)\s*\(|child_process|execSync|spawnSync|os\.system\s*\(|subprocess\.(Popen|call|run|check_output|check_call)|pickle\.loads|yaml\.load\s*\(/;
const shellPipe = /\bcurl\b.+\|\s*(sh|bash)|\bwget\b.+\|\s*(sh|bash)/;
const network = /\b(fetch|axios|request|http\.request|https\.request|requests\.(get|post|put)|curl)\b/;
const envAccess = /process\.env|os\.environ|Deno\.env|import\.meta\.env/;

export const networkAndExecRule: Rule = (files) => {
  const findings = [];
  const execFiles: string[] = [];
  const pipeFiles: string[] = [];
  const exfilFiles: string[] = [];

  for (const file of files) {
    const added = file.addedLines.join("\n");
    if (dynamicExec.test(added)) execFiles.push(file.path);
    if (shellPipe.test(added)) pipeFiles.push(file.path);
    if (network.test(added) && envAccess.test(added)) exfilFiles.push(file.path);
  }

  if (execFiles.length > 0) findings.push({ ruleId: "dynamic-execution-added", severity: "high" as const, score: 30, message: "Dynamic execution or unsafe deserialization added", files: execFiles });
  if (pipeFiles.length > 0) findings.push({ ruleId: "remote-shell-pipe", severity: "critical" as const, score: 100, message: "Remote script piped into shell", files: pipeFiles, halt: true });
  if (exfilFiles.length > 0) findings.push({ ruleId: "network-egress-with-env-access", severity: "critical" as const, score: 100, message: "Network egress added near environment/secret access", files: exfilFiles, halt: true });

  return findings;
};
