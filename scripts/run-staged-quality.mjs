import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FULL_TEST_TRIGGER_FILES,
  isLintFile,
  isSrcStyleFile,
  isVitestRelatedFile,
} from './run-staged-quality.helpers.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function run(command, args) {
  const result =
    process.platform === 'win32' && command.endsWith('.cmd')
      ? spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command, ...args], {
          stdio: 'inherit',
        })
      : spawnSync(command, args, {
          stdio: 'inherit',
        });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getStagedFiles() {
  const output = execFileSync(
    gitBin,
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
    { encoding: 'utf8' },
  );

  return output
    .split('\0')
    .filter(Boolean)
    .filter((file) => {
      const absolutePath = resolve(file);
      return existsSync(absolutePath) && statSync(absolutePath).isFile();
    });
}

function logStep(message) {
  console.log(`\n> ${message}`);
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  logStep('No staged files matched the scoped quality checks');
  process.exit(0);
}

const lintFiles = stagedFiles.filter(isLintFile);
const stylelintFiles = stagedFiles.filter(isSrcStyleFile);
const shouldRunFullTestSuite = stagedFiles.some((file) =>
  FULL_TEST_TRIGGER_FILES.has(file),
);
const vitestRelatedFiles = stagedFiles.filter(isVitestRelatedFile);

if (lintFiles.length > 0) {
  logStep(`Running Oxlint --fix on ${lintFiles.length} staged file(s)`);
  run(pnpmBin, ['exec', 'oxlint', '-c', '.oxlintrc.json', '--fix', ...lintFiles]);
} else {
  logStep('Skipping staged Oxlint, no matching files');
}

if (stylelintFiles.length > 0) {
  logStep(`Running Stylelint on ${stylelintFiles.length} staged file(s)`);
  run(pnpmBin, ['exec', 'stylelint', ...stylelintFiles]);
} else {
  logStep('Skipping staged Stylelint, no matching files');
}

if (shouldRunFullTestSuite) {
  logStep('Running full Vitest suite because a shared test input changed');
  run(pnpmBin, ['test']);
} else if (vitestRelatedFiles.length > 0) {
  logStep(
    `Running Vitest related for ${vitestRelatedFiles.length} staged file(s)`,
  );
  run(pnpmBin, [
    'exec',
    'vitest',
    'related',
    '--run',
    '--passWithNoTests',
    ...vitestRelatedFiles,
  ]);
} else {
  logStep('Skipping scoped Vitest, no related staged source files');
}
