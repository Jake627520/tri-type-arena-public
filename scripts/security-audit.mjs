import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXCLUDED_FILE_PATHS = new Set([
  'scripts/security-audit.mjs',
  'tests/security-audit.test.mjs',
  'tests/license-audit.test.mjs',
]);

export const SECRET_PATTERNS = [
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS Secret Key', regex: /(?:aws_secret_access_key|aws_session_token)\s*=\s*[A-Za-z0-9\/+=]{40}/i },
  { name: 'GitHub Personal Access Token', regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: 'GitHub OAuth Token', regex: /gho_[a-zA-Z0-9]{36}/ },
  { name: 'Slack Token', regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/ },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{32,51}/ },
  { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9_-]{32,}/ },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----/ },
  { name: 'Generic Password Assignment', regex: /(?:password|secret|passwd|token)\s*[:=]\s*['"][a-zA-Z0-9@#$%^&+=_-]{8,}['"]/i },
];

/**
 * Scan arbitrary text for secrets with strict path-based exclusion and credential masking.
 */
export function scanTextForSecrets(text, filePath = '') {
  const findings = [];
  if (!text || typeof text !== 'string') return findings;

  // Path-based exclusion only: never exclude arbitrary content based on keywords like "exclude"
  if (filePath && Array.from(EXCLUDED_FILE_PATHS).some((p) => filePath.endsWith(p))) {
    return findings;
  }

  for (const rule of SECRET_PATTERNS) {
    if (rule.regex.test(text)) {
      findings.push({
        rule: rule.name,
        snippet: '***REDACTED***',
      });
    }
  }
  return findings;
}

export function checkGitHistory(deps = {}) {
  const runner = deps.execSync || ((cmd) => execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 }));
  const findings = [];

  try {
    const gitLogDiff = runner('git log -p --full-history');
    if (!gitLogDiff || typeof gitLogDiff !== 'string') {
      findings.push({
        type: 'Audit Tool Failure',
        rule: 'git log returned empty or unparseable output',
      });
      return findings;
    }

    const lines = gitLogDiff.split('\n');
    let currentCommit = 'initial';
    let currentFile = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('commit ')) {
        currentCommit = line.split(' ')[1];
      } else if (line.startsWith('diff --git ')) {
        const parts = line.split(' ');
        currentFile = parts[2] ? parts[2].replace(/^a\//, '') : '';
      }

      // Skip scanning if the diff is within explicitly excluded audit/test files
      if (currentFile && Array.from(EXCLUDED_FILE_PATHS).some((p) => currentFile.endsWith(p))) {
        continue;
      }

      if (line.startsWith('+') && !line.startsWith('+++')) {
        for (const rule of SECRET_PATTERNS) {
          if (rule.regex.test(line)) {
            findings.push({
              type: 'Git History Commit',
              commit: currentCommit,
              file: currentFile,
              rule: rule.name,
              snippet: '***REDACTED***',
            });
          }
        }
      }
    }
  } catch (err) {
    findings.push({
      type: 'Audit Tool Failure',
      rule: `git log scan failed: ${err.message}`,
    });
  }

  return findings;
}

export function checkTrackedFiles(deps = {}) {
  const runner = deps.execSync || ((cmd) => execSync(cmd, { encoding: 'utf8' }));
  const findings = [];

  try {
    const trackedFiles = runner('git ls-files').trim().split('\n');
    for (const relPath of trackedFiles) {
      if (!fs.existsSync(relPath)) continue;
      if (Array.from(EXCLUDED_FILE_PATHS).some((p) => relPath.endsWith(p))) continue;

      const content = fs.readFileSync(relPath, 'utf8');
      for (const rule of SECRET_PATTERNS) {
        if (rule.regex.test(content)) {
          findings.push({
            type: 'Tracked File',
            file: relPath,
            rule: rule.name,
            snippet: '***REDACTED***',
          });
        }
      }
    }
  } catch (err) {
    findings.push({
      type: 'Audit Tool Failure',
      rule: `git ls-files scan failed: ${err.message}`,
    });
  }

  return findings;
}

export function checkGitleaks(deps = {}) {
  const runner = deps.execSync || ((cmd) => execSync(cmd, { encoding: 'utf8' }));
  const isCI = deps.isCI !== undefined ? deps.isCI : process.env.CI === 'true';
  const findings = [];

  try {
    const gitleaksBin = runner('which gitleaks || true').trim();
    if (!gitleaksBin) {
      if (isCI) {
        findings.push({
          type: 'Gitleaks Missing',
          rule: 'Gitleaks CLI is required in CI environment but was not found',
        });
      } else {
        console.warn('WARNING: Gitleaks not installed locally; skipping binary execution.');
      }
      return findings;
    }

    if (deps.runGitleaks) {
      deps.runGitleaks(gitleaksBin);
    } else {
      console.log(`Running external Gitleaks binary: ${gitleaksBin}`);
      execSync(`${gitleaksBin} detect --source . --verbose`, { stdio: 'inherit' });
      console.log('Gitleaks scan passed with zero leaks.');
    }
  } catch (err) {
    findings.push({
      type: 'Gitleaks CLI',
      rule: 'Gitleaks detected secret leaks in git history',
      snippet: '***REDACTED***',
    });
  }

  return findings;
}

export function checkNpmAudit(deps = {}) {
  const runner = deps.execSync || ((cmd) => execSync(cmd, { encoding: 'utf8' }));
  const findings = [];

  try {
    const auditOutput = runner('npm audit --json');
    const auditData = JSON.parse(auditOutput);
    if (!auditData || typeof auditData !== 'object' || !auditData.metadata) {
      findings.push({
        type: 'Audit Tool Failure',
        rule: 'npm audit returned invalid JSON structure',
      });
      return findings;
    }
    const vulnTotal = auditData.metadata?.vulnerabilities?.total ?? 0;
    if (vulnTotal > 0) {
      findings.push({
        type: 'Dependency Vulnerability',
        rule: `npm audit detected ${vulnTotal} vulnerabilities`,
      });
    }
  } catch (err) {
    if (err.stdout) {
      try {
        const auditData = JSON.parse(err.stdout);
        const vulnTotal = auditData.metadata?.vulnerabilities?.total ?? 0;
        if (vulnTotal > 0) {
          findings.push({
            type: 'Dependency Vulnerability',
            rule: `npm audit detected ${vulnTotal} vulnerabilities`,
          });
          return findings;
        }
      } catch {}
    }
    findings.push({
      type: 'Audit Tool Failure',
      rule: `npm audit execution or parse failed: ${err.message}`,
    });
  }

  return findings;
}

export function runSecurityAudit() {
  const allFindings = [
    ...checkGitHistory(),
    ...checkTrackedFiles(),
    ...checkGitleaks(),
    ...checkNpmAudit(),
  ];

  console.log('--- Security Audit Summary ---');
  console.log(`Total Findings: ${allFindings.length}`);
  if (allFindings.length > 0) {
    console.error('CRITICAL: Security findings detected in repository!');
    for (const f of allFindings) {
      console.error(` - [${f.type}] ${f.rule} (file: ${f.file || 'n/a'}, commit: ${f.commit || 'n/a'})`);
    }
    process.exit(1);
  } else {
    console.log('ZERO secrets, credentials, or dependency vulnerabilities detected!');
  }
}

// Auto-run if executed as CLI entry point
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  runSecurityAudit();
}
