import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FULL_TEST_TRIGGER_FILES,
  getQueuedQualityTasks,
  isLintFile,
  isSrcStyleFile,
  isVitestRelatedFile,
} from './run-staged-quality.helpers.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const pnpmBin = 'pnpm';

function run(command, args) {
  const result = spawnSync(command, args, {
    shell: process.platform === 'win32',
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

function runConcurrent(commands) {
  const names = commands.map(({ name }) => name).join(',');
  const args = ['exec', 'concurrently', '--names', names, '--kill-others-on-fail'];

  for (const { args: commandArgs } of commands) {
    args.push([pnpmBin, ...commandArgs].join(' '));
  }

  run(pnpmBin, args);
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
  logStep(`Queueing Stylelint for ${stylelintFiles.length} staged file(s)`);
} else {
  logStep('Skipping staged Stylelint, no matching files');
}

if (shouldRunFullTestSuite) {
  logStep('Queueing full Vitest suite because a shared test input changed');
} else if (vitestRelatedFiles.length > 0) {
  logStep(
    `Queueing Vitest related for ${vitestRelatedFiles.length} staged file(s)`,
  );
} else {
  logStep('Skipping scoped Vitest, no related staged source files');
}

const queuedTasks = getQueuedQualityTasks(
  stylelintFiles,
  vitestRelatedFiles,
  shouldRunFullTestSuite,
);

if (queuedTasks.length === 0) {
  process.exit(0);
}

if (queuedTasks.length === 1) {
  const [{ name, args }] = queuedTasks;
  logStep(`Running ${name} without concurrently because it is the only queued task`);
  run(pnpmBin, args);
  process.exit(0);
}

logStep(`Running ${queuedTasks.length} staged quality task(s) with concurrently`);
runConcurrent(queuedTasks);
