import type { Rule } from "../types.js";
import { authAndSecretsRule } from "./auth-and-secrets.js";
import { dependencyChangesRule } from "./dependency-changes.js";
import { destructiveOpsRule } from "./destructive-ops.js";
import { generatedCodeSizeRule } from "./generated-code-size.js";
import { networkAndExecRule } from "./network-and-exec.js";
import { sensitiveFilesRule } from "./sensitive-files.js";

export const defaultRules: Rule[] = [
  sensitiveFilesRule,
  authAndSecretsRule,
  dependencyChangesRule,
  destructiveOpsRule,
  networkAndExecRule,
  generatedCodeSizeRule
];
