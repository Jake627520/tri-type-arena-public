import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');

test('compliance: root license and community files exist and are non-empty', () => {
  const requiredFiles = [
    'LICENSE',
    'README.md',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'SECURITY.md',
    'THIRD_PARTY_NOTICES.md',
    'docs/LICENSE_AUDIT.md',
    'docs/ASSET_PROVENANCE.md',
    '.github/workflows/license-check.yml',
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(ROOT, relPath);
    assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 50, `File ${relPath} is unexpectedly small or empty`);
  }
});

test('compliance: LICENSE contains valid MIT text and no copyleft mention', () => {
  const licenseText = fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8');
  assert.ok(licenseText.includes('MIT License'), 'LICENSE must be MIT');
  assert.ok(!licenseText.includes('General Public License'), 'LICENSE must not contain GPL text');
});

test('compliance: package.json declares MIT license', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.license, 'MIT', 'package.json must declare MIT');
});

test('compliance: no committed secrets found in source and config files', () => {
  const secretPatterns = [
    /ghp_[a-zA-Z0-9]{36}/,
    /xox[baprs]-[0-9a-zA-Z]{10,48}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----/,
  ];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name === '.git' || ent.name === 'node_modules' || ent.name.startsWith('security-audit')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile() && (ent.name.endsWith('.js') || ent.name.endsWith('.mjs') || ent.name.endsWith('.ts') || ent.name.endsWith('.tsx') || ent.name.endsWith('.json') || ent.name.endsWith('.md'))) {
        const content = fs.readFileSync(full, 'utf8');
        for (const pat of secretPatterns) {
          assert.ok(!pat.test(content), `Found potential secret in ${full} matching ${pat}`);
        }
      }
    }
  }

  walk(ROOT);
});

test('license: SPDX evaluator rejects prohibited copyleft even when paired with MIT in AND expression', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('(MIT AND GPL-3.0)'), false, 'AND expression containing copyleft must fail');
  assert.equal(isSpdxCompliant('(MIT AND AGPL-3.0-only)'), false, 'AGPL must fail');
  assert.equal(isSpdxCompliant('GPL-2.0-or-later'), false, 'Solo GPL must fail');
});

test('license: SPDX evaluator rejects unapproved proprietary or unknown licenses', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('UNKNOWN'), false, 'UNKNOWN must fail');
  assert.equal(isSpdxCompliant('Proprietary'), false, 'Proprietary must fail');
  assert.equal(isSpdxCompliant('CC-BY-NC-4.0'), false, 'Non-commercial license must fail');
  assert.equal(isSpdxCompliant('(MIT AND CC-BY-NC-4.0)'), false, 'MIT AND non-commercial must fail');
});

test('license: SPDX evaluator accepts dual-licensed OR expression where at least one choice is permissive', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('(MIT OR GPL-3.0)'), true, 'Permissive choice in OR must pass');
  assert.equal(isSpdxCompliant('(Apache-2.0 OR BSD-3-Clause)'), true, 'Dual permissive must pass');
});

test('license: SPDX evaluator accepts multiple permissible licenses in AND expression', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('(MIT AND Apache-2.0)'), true, 'Both permissive in AND must pass');
  assert.equal(isSpdxCompliant('(BSD-3-Clause AND MIT AND ISC)'), true, 'All permissive in AND must pass');
});

test('license: SPDX evaluator accepts permissible license with standard exception', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('Apache-2.0 WITH LLVM-exception'), true, 'LLVM exception on Apache-2.0 must pass');
});

test('license: strict parser rejects unmatched opening or closing parentheses', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('(MIT'), false, 'Unclosed paren must fail');
  assert.equal(isSpdxCompliant('MIT)'), false, 'Unopened paren must fail');
  assert.equal(isSpdxCompliant('((MIT OR Apache-2.0)'), false, 'Nested unclosed paren must fail');
  assert.equal(isSpdxCompliant('MIT OR (Apache-2.0 AND ISC'), false, 'Unclosed subexpression paren must fail');
});

test('license: strict parser rejects trailing unexpected tokens', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('MIT extra'), false, 'Trailing token after license must fail');
  assert.equal(isSpdxCompliant('(MIT) Apache-2.0'), false, 'Trailing token after group must fail');
  assert.equal(isSpdxCompliant('MIT OR Apache-2.0 foo'), false, 'Trailing token after OR expression must fail');
});

test('license: strict parser rejects missing operands in expressions', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('MIT OR'), false, 'Trailing OR must fail');
  assert.equal(isSpdxCompliant('OR MIT'), false, 'Leading OR must fail');
  assert.equal(isSpdxCompliant('MIT AND'), false, 'Trailing AND must fail');
  assert.equal(isSpdxCompliant('AND Apache-2.0'), false, 'Leading AND must fail');
  assert.equal(isSpdxCompliant('MIT OR OR Apache-2.0'), false, 'Consecutive operators must fail');
});

test('license: strict parser rejects illegal or unapproved WITH exceptions', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant('MIT WITH'), false, 'WITH without exception must fail');
  assert.equal(isSpdxCompliant('Apache-2.0 WITH'), false, 'Apache-2.0 WITH without exception must fail');
  assert.equal(isSpdxCompliant('Apache-2.0 WITH InvalidException123'), false, 'Unapproved exception must fail');
  assert.equal(isSpdxCompliant('WITH LLVM-exception'), false, 'Leading WITH must fail');
});

test('license: strict parser enforces operator precedence: WITH > AND > OR', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  // MIT OR (Apache-2.0 AND GPL-3.0) -> licensee can choose MIT branch -> true
  assert.equal(isSpdxCompliant('MIT OR Apache-2.0 AND GPL-3.0'), true, 'AND binds tighter than OR');
  // (MIT OR Apache-2.0) AND GPL-3.0 -> GPL-3.0 is required -> false
  assert.equal(isSpdxCompliant('(MIT OR Apache-2.0) AND GPL-3.0'), false, 'Grouped expression required copyleft must fail');
  // GPL-3.0 AND Apache-2.0 WITH LLVM-exception -> GPL-3.0 required -> false
  assert.equal(isSpdxCompliant('GPL-3.0 AND Apache-2.0 WITH LLVM-exception'), false, 'GPL-3.0 in conjunction must fail');
  // GPL-3.0 OR Apache-2.0 WITH LLVM-exception -> Permissive WITH branch can be chosen -> true
  assert.equal(isSpdxCompliant('GPL-3.0 OR Apache-2.0 WITH LLVM-exception'), true, 'Permissive WITH choice must pass');
});

test('license: strict parser fails closed on empty or invalid expressions', async () => {
  const { isSpdxCompliant } = await import('../scripts/spdx-evaluator.mjs');
  assert.equal(isSpdxCompliant(''), false, 'Empty string must fail');
  assert.equal(isSpdxCompliant('   '), false, 'Whitespace must fail');
  assert.equal(isSpdxCompliant('!@#$%'), false, 'Invalid chars must fail');
});
