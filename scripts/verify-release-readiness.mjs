import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "action/action.yml",
  "action/entrypoint.sh",
  "dist/cli.js",
  "rules/default.yml",
  "policy-packs/node-express.yml",
  "policy-packs/python-django.yml",
  "policy-packs/terraform.yml",
  "docs/release-readiness.md",
  "docs/security-review.md",
  "docs/audit-retention-and-export.md",
  "docs/buyer-validation-protocol.md",
  "docs/architecture-history.md",
  "docs/demo-media/allow-review-halt.svg",
  "docs/demo-media/pilot-workflow.svg"
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required release artifact: ${file}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version ?? "")) {
  failures.push(`package.json version is not valid semver: ${String(packageJson.version)}`);
}

for (const [name, version] of Object.entries(packageJson.devDependencies ?? {})) {
  if (typeof version !== "string" || /^[~^*]|latest$/i.test(version)) {
    failures.push(`devDependency ${name} is not pinned to an exact version: ${String(version)}`);
  }
}

if (Object.keys(packageJson.dependencies ?? {}).length !== 0) {
  failures.push("runtime dependencies must remain empty for the current action release candidate");
}

const actionManifest = readFileSync("action/action.yml", "utf8");
if (!actionManifest.includes("using: composite")) {
  failures.push("action/action.yml is not a composite action manifest");
}

const readme = readFileSync("README.md", "utf8");
if (!readme.includes("Pin a release tag") && !readme.includes("pinned release")) {
  failures.push("README.md does not preserve the pinned-release production warning");
}

if (failures.length > 0) {
  process.stderr.write(`${failures.map((failure) => `- ${failure}`).join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `${JSON.stringify(
    {
      status: "READY_FOR_REVIEW",
      packageVersion: packageJson.version,
      requiredArtifacts: requiredFiles.length,
      directRuntimeDependencies: 0,
      directDevelopmentDependenciesPinned: Object.keys(packageJson.devDependencies ?? {}).length,
      publicationAuthorized: false,
      externalBuyerValidationComplete: false
    },
    null,
    2
  )}\n`
);
