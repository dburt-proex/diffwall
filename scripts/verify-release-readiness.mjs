import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "package-lock.json",
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
  "docs/demo-media/pilot-workflow.svg",
  "docs/releases/v0.2.0-decision.md",
  "docs/releases/v0.2.0.md"
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required release artifact: ${file}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version ?? "")) {
  failures.push(`package.json version is not valid semver: ${String(packageJson.version)}`);
}

for (const [name, version] of Object.entries(packageJson.devDependencies ?? {})) {
  if (typeof version !== "string" || /^[~^*]|latest$/i.test(version)) {
    failures.push(`devDependency ${name} is not pinned to an exact version: ${String(version)}`);
  }
}

if (Object.keys(packageJson.dependencies ?? {}).length !== 0) {
  failures.push("runtime dependencies must remain empty for the current action release");
}

if (packageLock.version !== packageJson.version) {
  failures.push(
    `package-lock.json version ${String(packageLock.version)} does not match package.json version ${String(packageJson.version)}`
  );
}

if (packageLock.packages?.[""]?.version !== packageJson.version) {
  failures.push("package-lock.json root package version does not match package.json");
}

const actionManifest = readFileSync("action/action.yml", "utf8");
if (!actionManifest.includes("using: composite")) {
  failures.push("action/action.yml is not a composite action manifest");
}

const readme = readFileSync("README.md", "utf8");
if (!readme.includes("dburt-proex/diffwall/action@v0.2.0")) {
  failures.push("README.md does not use the approved pinned v0.2.0 action reference");
}

const releaseDecision = readFileSync("docs/releases/v0.2.0-decision.md", "utf8");
const publicationAuthorized =
  releaseDecision.includes("Decision:** `ALLOW`") &&
  releaseDecision.includes("Tag:** `v0.2.0`") &&
  packageJson.version === "0.2.0";

if (!publicationAuthorized) {
  failures.push("v0.2.0 publication is not authorized by the canonical release decision");
}

if (failures.length > 0) {
  process.stderr.write(`${failures.map((failure) => `- ${failure}`).join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `${JSON.stringify(
    {
      status: "READY_FOR_PUBLICATION",
      packageVersion: packageJson.version,
      requiredArtifacts: requiredFiles.length,
      directRuntimeDependencies: 0,
      directDevelopmentDependenciesPinned: Object.keys(packageJson.devDependencies ?? {}).length,
      publicationAuthorized,
      externalBuyerValidationComplete: false
    },
    null,
    2
  )}\n`
);
