import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FULL_TEST_TRIGGER_FILES,
  isLintFile,
  isSrcStyleFile,
  isVitestRelatedFile,
} from './run-staged-quality.helpers.mjs';
import { createPnpmInvocation } from './pnpm-command.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';

function run(command, args) {
  const result = spawnSync(command, args, {
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
  const pnpm = createPnpmInvocation([
    'exec',
    'oxlint',
    '-c',
    '.oxlintrc.json',
    '--fix',
    ...lintFiles,
  ]);
  run(pnpm.command, pnpm.args);
} else {
  logStep('Skipping staged Oxlint, no matching files');
}

if (stylelintFiles.length > 0) {
  logStep(`Running Stylelint on ${stylelintFiles.length} staged file(s)`);
  const pnpm = createPnpmInvocation(['exec', 'stylelint', ...stylelintFiles]);
  run(pnpm.command, pnpm.args);
} else {
  logStep('Skipping staged Stylelint, no matching files');
}

if (shouldRunFullTestSuite) {
  logStep('Running full Vitest suite because a shared test input changed');
  const pnpm = createPnpmInvocation(['test']);
  run(pnpm.command, pnpm.args);
} else if (vitestRelatedFiles.length > 0) {
  logStep(
    `Running Vitest related for ${vitestRelatedFiles.length} staged file(s)`,
  );
  const pnpm = createPnpmInvocation([
    'exec',
    'vitest',
    'related',
    '--run',
    '--passWithNoTests',
    ...vitestRelatedFiles,
  ]);
  run(pnpm.command, pnpm.args);
} else {
  logStep('Skipping scoped Vitest, no related staged source files');
}
