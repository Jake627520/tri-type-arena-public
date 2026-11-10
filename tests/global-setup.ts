import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Produces dist/assets once before the suite when it is missing.
 *
 * The injection-isolation test only inspects the production bundle. Building
 * inside that test shares Vitest's default 5s test timeout, which is too
 * short for a cold vite build. `npm run check` also runs Vitest before
 * `npm run build`.
 */
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distAssetsDir = path.join(rootDir, 'dist', 'assets');
const buildCommand = 'npx vite build --mode production';

function outputOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return '';
}

function formatBuildFailure(error: unknown): string {
  const err = (error ?? {}) as { stdout?: unknown; stderr?: unknown; message?: unknown };
  const stdout = outputOf(err.stdout).trim();
  const stderr = outputOf(err.stderr).trim();
  const message = outputOf(err.message).trim();
  const sections = [
    `Vitest globalSetup could not create ${distAssetsDir}.`,
    `Command: ${buildCommand}`,
    `Working directory: ${rootDir}`,
  ];
  if (stdout) sections.push(`stdout:\n${stdout}`);
  if (stderr) sections.push(`stderr:\n${stderr}`);
  // Node's execSync message repeats the captured streams. Keep it only when
  // those streams are empty (for example, the command could not be spawned).
  if (message && !stdout && !stderr) sections.push(message);
  return sections.join('\n\n');
}

export function setup(): void {
  if (fs.existsSync(distAssetsDir)) return;

  console.log(`dist/assets is missing; running \`${buildCommand}\` before tests.`);

  try {
    execSync(buildCommand, {
      cwd: rootDir,
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'pipe',
      encoding: 'utf-8',
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(formatBuildFailure(error));
  }

  if (!fs.existsSync(distAssetsDir)) {
    throw new Error(
      `Vite production build exited successfully but ${distAssetsDir} is still missing. ` +
        'The injection-isolation test needs the production JS bundles in dist/assets.',
    );
  }
}
