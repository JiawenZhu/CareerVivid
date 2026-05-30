#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import process from "node:process";

const allowedPrefixes = [
  "src/features/agency-partner/",
  "functions/src/agencyPartner/",
  "docs/agency-partnerships/",
];

const integrationExceptionPaths = new Set([
  "src/App.tsx",
  "src/types.ts",
  "firestore.rules",
  "firestore.indexes.json",
  "functions/src/index.ts",
  "functions/src/triggers.ts",
  "src/pages/admin/components/PartnerApplicationManagement.tsx",
]);

const args = new Set(process.argv.slice(2));
const allowIntegration = args.has("--allow-integration");

const git = (args) =>
  execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const changedFiles = Array.from(
  new Set([
    ...git(["diff", "--name-only"]),
    ...git(["diff", "--cached", "--name-only"]),
    ...git(["ls-files", "--others", "--exclude-standard"]),
  ])
).sort();

const inAllowedScope = (file) => allowedPrefixes.some((prefix) => file.startsWith(prefix));
const isIntegrationException = (file) => integrationExceptionPaths.has(file);

const outOfScope = changedFiles.filter((file) => {
  if (inAllowedScope(file)) return false;
  if (allowIntegration && isIntegrationException(file)) return false;
  return true;
});

const integrationTouched = changedFiles.filter((file) => isIntegrationException(file));

if (changedFiles.length === 0) {
  console.log("Agency scope check: no changed files.");
  process.exit(0);
}

if (outOfScope.length > 0) {
  console.error("Agency scope check failed. These files are outside the agency partner guardrail:");
  for (const file of outOfScope) {
    console.error(`- ${file}`);
  }
  console.error("");
  console.error("Allowed agency write scopes:");
  for (const prefix of allowedPrefixes) {
    console.error(`- ${prefix}`);
  }
  console.error("");
  console.error("If a small route/rules/export integration edit was approved, rerun with:");
  console.error("node scripts/check-agency-scope.mjs --allow-integration");
  process.exit(1);
}

console.log(`Agency scope check passed. ${changedFiles.length} changed file(s) stay within the agency guardrail.`);

if (allowIntegration && integrationTouched.length > 0) {
  console.log("");
  console.log("Approved integration exception file(s) touched:");
  for (const file of integrationTouched) {
    console.log(`- ${file}`);
  }
  console.log("Document why each exception was necessary in the handoff.");
}
