import type { Rule } from "../types.js";
import { authAndSecretsRule } from "./auth-and-secrets.js";
import { configuredHaltPatternsRule } from "./configured-halt-patterns.js";
import { dependencyChangesRule } from "./dependency-changes.js";
import { destructiveOpsRule } from "./destructive-ops.js";
import { generatedCodeSizeRule } from "./generated-code-size.js";
import { githubActionsRule } from "./github-actions.js";
import { networkAndExecRule } from "./network-and-exec.js";
import { sensitiveFilesRule } from "./sensitive-files.js";

export const defaultRules: Rule[] = [
  sensitiveFilesRule,
  configuredHaltPatternsRule,
  authAndSecretsRule,
  dependencyChangesRule,
  destructiveOpsRule,
  networkAndExecRule,
  githubActionsRule,
  generatedCodeSizeRule
];
