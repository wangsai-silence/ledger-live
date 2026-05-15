import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Direct dependencies that are NOT redistributed in the published binary:
// build-time tooling, types, peer-only declarations tree-shaken out by bun.
// Anything else listed in apps/wallet-cli/package.json must appear in
// THIRD_PARTY_NOTICES.md so its upstream attribution clauses are honored.
const NON_REDISTRIBUTED = new Set([
  "@bunli/core",
  "@bunli/utils",
  "@oxlint/binding-darwin-arm64",
  "@oxlint/binding-darwin-x64",
  "@oxlint/binding-linux-x64-gnu",
  "@oxlint/binding-win32-x64-msvc",
  "@types/debug",
  "@types/node",
  "@types/w3c-web-usb",
  "bun-types",
  "bunli",
  "oxfmt",
  "oxlint",
  "react",
  "typescript",
]);

const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const notices = await readFile(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");

const redistributed = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
].filter(name => !NON_REDISTRIBUTED.has(name));

const missing = redistributed.filter(name => !notices.includes(`\`${name}\``));

if (missing.length > 0) {
  console.error("THIRD_PARTY_NOTICES.md is missing the following redistributed dependencies:");
  for (const name of missing) {
    console.error(`  - ${name}`);
  }
  console.error(
    "\nEach direct dependency declared in apps/wallet-cli/package.json that ships",
  );
  console.error("inside the published binary must appear in THIRD_PARTY_NOTICES.md,");
  console.error("quoted in backticks (e.g. `package-name`). If the new dep is build-only");
  console.error("and not redistributed, add it to the NON_REDISTRIBUTED set in this script.");
  process.exit(1);
}

console.log(`THIRD_PARTY_NOTICES.md covers all ${redistributed.length} redistributed dependencies.`);
