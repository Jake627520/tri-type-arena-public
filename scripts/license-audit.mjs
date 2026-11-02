import fs from 'node:fs';
import path from 'node:path';
import { ALLOWED_LICENSES, PROHIBITED_SUBSTRINGS, isSpdxCompliant } from './spdx-evaluator.mjs';

const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const packages = lockfile.packages || {};

const inventory = [];
const violations = [];

for (const [pkgPath, pkgData] of Object.entries(packages)) {
  if (!pkgPath) continue; // root
  const name = pkgData.name || pkgPath.replace(/^node_modules\//, '');
  const version = pkgData.version || 'unknown';
  let license = pkgData.license;

  // If license is undefined, check package.json in node_modules
  if (!license) {
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const p = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        license = p.license || (p.licenses ? p.licenses.map((l) => l.type || l).join(' OR ') : undefined);
      } catch {}
    }
  }

  const licStr = String(license || 'UNKNOWN');
  const isAllowed = isSpdxCompliant(licStr);

  inventory.push({ name, version, license: licStr, isAllowed });

  if (!isAllowed) {
    violations.push({ name, version, license: licStr });
  }
}

console.log(`Audited ${inventory.length} total direct and transitive packages.`);
console.log(`Violations / Copyleft / Unknown: ${violations.length}`);

if (violations.length > 0) {
  console.error('Prohibited, Unapproved, or Unknown Licenses detected:', violations);
  process.exit(1);
} else {
  console.log('All packages verified permissive and compatible with MIT public release!');
}
