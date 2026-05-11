import { spawnSync } from 'node:child_process';
import process from 'node:process';
import {
  createNcuArgs,
  DEPENDENCY_SANITY_COMMANDS,
  getDependencyCommitMessage,
  getUnexpectedChangedFiles,
  parseChangedFiles,
  parseCliArgs,
} from './dependency-updates.helpers.mjs';
import { createPnpmInvocation } from './pnpm-command.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';

function fail(message) {
  process.stderr.write(`Dependency update script failed: ${message}\n`);
  process.exit(1);
}

function getCommandError(result, fallbackMessage) {
  return (
    result.stderr ||
    result.stdout ||
    result.error?.message ||
    fallbackMessage
  ).trim();
}

function run(command, args, { allowFailure = false, capture = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (!allowFailure && result.status !== 0) {
    fail(getCommandError(result, `${command} ${args.join(' ')} failed.`));
  }

  return result;
}

function runGit(args, options) {
  return run(gitBin, args, options);
}

function readGit(args) {
  return runGit(args, { capture: true }).stdout.trim();
}

function logStep(message) {
  console.log(`\n> ${message}`);
}

function printUsage() {
  console.log(`Usage:
  node scripts/dependency-updates.mjs check
  node scripts/dependency-updates.mjs update --target minor [--no-commit]
  node scripts/dependency-updates.mjs update --target major [--no-commit]`);
}

function ensureGitWorktree() {
  if (readGit(['rev-parse', '--is-inside-work-tree']) !== 'true') {
    fail('Current directory is not inside a git worktree.');
  }
}

function ensureCleanTrackedWorktree() {
  const status = readGit(['status', '--porcelain', '--untracked-files=no']);

  if (status !== '') {
    fail(
      'Run dependency updates from a clean tracked worktree so the generated commit only includes dependency changes.',
    );
  }
}

function getTrackedDiffFiles() {
  return parseChangedFiles(readGit(['diff', '--name-only']));
}

function ensureExpectedChangedFiles(changedFiles) {
  const unexpectedFiles = getUnexpectedChangedFiles(changedFiles);

  if (unexpectedFiles.length > 0) {
    fail(
      `Dependency update touched unexpected tracked files: ${unexpectedFiles.join(', ')}`,
    );
  }
}

function runPnpm(args, message) {
  logStep(message);

  const pnpm = createPnpmInvocation(args);
  run(pnpm.command, pnpm.args);
}

function stageDependencyFiles() {
  runGit(['add', '--', 'package.json', 'pnpm-lock.yaml']);
}

let options;

try {
  options = parseCliArgs(process.argv.slice(2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (options.help) {
  printUsage();
  process.exit(0);
}

if (options.command === 'check') {
  runPnpm(
    createNcuArgs({ command: 'check', target: null }),
    'Checking available dependency updates',
  );
  process.exit(0);
}

ensureGitWorktree();
ensureCleanTrackedWorktree();

runPnpm(
  createNcuArgs({ command: 'update', target: options.target }),
  `Updating ${options.target} dependency versions`,
);

let changedFiles = getTrackedDiffFiles();

if (changedFiles.length === 0) {
  console.log('\n> No dependency updates were applied.');
  process.exit(0);
}

ensureExpectedChangedFiles(changedFiles);

runPnpm(
  ['install', '--no-frozen-lockfile'],
  'Installing refreshed dependencies',
);

for (const scriptName of DEPENDENCY_SANITY_COMMANDS) {
  runPnpm([scriptName], `Running pnpm ${scriptName} for dependency sanity`);
}

changedFiles = getTrackedDiffFiles();
ensureExpectedChangedFiles(changedFiles);

if (!options.commit) {
  console.log(
    '\n> Dependency updates are ready in the working tree without a commit.',
  );
  process.exit(0);
}

stageDependencyFiles();

runPnpm(
  ['git:commit', '--', '-m', getDependencyCommitMessage(options.target)],
  'Creating dependency update commit',
);
