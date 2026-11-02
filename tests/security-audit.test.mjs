import test from 'node:test';
import assert from 'node:assert/strict';
import { scanTextForSecrets } from '../scripts/security-audit.mjs';

test('security: scanTextForSecrets detects simulated AWS access key', () => {
  const dirty = ['const key = "', 'AKIA', '1234567890ABCDEF', '";'].join('');
  const findings = scanTextForSecrets(dirty);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'AWS Access Key');
});

test('security: scanTextForSecrets detects simulated GitHub personal access token', () => {
  const dirty = ['ghp_', '123456789012345678901234567890123456'].join('');
  const findings = scanTextForSecrets(dirty);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'GitHub Personal Access Token');
});

test('security: scanTextForSecrets detects private key block', () => {
  const dirty = ['-----BEGIN ', 'RSA', ' PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END ', 'RSA', ' PRIVATE KEY-----'].join('');
  const findings = scanTextForSecrets(dirty);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'Private Key Block');
});

test('security: scanTextForSecrets produces zero findings on clean application source', () => {
  const clean = 'export function calculateWpm(keystrokes, elapsedMs) { return (keystrokes / 5) / (elapsedMs / 60000); }';
  const findings = scanTextForSecrets(clean);
  assert.deepEqual(findings, []);
});

test('security: arbitrary text containing word exclude is NOT exempted from secret detection', () => {
  const dirtyWithExclude = ['const token = "', 'ghp_', '123456789012345678901234567890123456', '"; // exclude from git'].join('');
  const findings = scanTextForSecrets(dirtyWithExclude, 'src/api/client.ts');
  assert.ok(findings.length >= 1, 'Should not bypass scan just because word exclude is present');
  assert.ok(findings.some((f) => f.rule === 'GitHub Personal Access Token'));
});

test('security: sensitive characters are redacted and never leaked in finding records', () => {
  const dirty = ['const key = "', 'AKIA', '1234567890ABCDEF', '";'].join('');
  const findings = scanTextForSecrets(dirty, 'src/config.ts');
  assert.equal(findings.length, 1);
  assert.ok(findings[0].snippet !== dirty, 'Must not echo raw secret string');
  assert.equal(findings[0].snippet, '***REDACTED***');
});

test('security: git log failure triggers fatal finding (fail-closed)', async () => {
  const { checkGitHistory } = await import('../scripts/security-audit.mjs');
  const mockRunner = () => { throw new Error('git command not found'); };
  const findings = checkGitHistory({ execSync: mockRunner });
  assert.ok(findings.length > 0, 'Must record finding when git log fails');
  assert.match(findings[0].rule, /git log/i);
});

test('security: npm audit unparseable or non-zero exit triggers fatal finding', async () => {
  const { checkNpmAudit } = await import('../scripts/security-audit.mjs');
  const mockRunner = () => 'Invalid JSON output from audit';
  const findings = checkNpmAudit({ execSync: mockRunner });
  assert.ok(findings.length > 0, 'Must record finding when audit output is unparseable');
});

test('security: missing Gitleaks in CI environment triggers fatal finding', async () => {
  const { checkGitleaks } = await import('../scripts/security-audit.mjs');
  const mockRunner = () => ''; // which gitleaks returns empty
  const findings = checkGitleaks({ execSync: mockRunner, isCI: true });
  assert.ok(findings.length > 0, 'Must fail in CI when gitleaks binary is absent');
  assert.match(findings[0].rule, /Gitleaks/i);
});
