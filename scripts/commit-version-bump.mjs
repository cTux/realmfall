import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const packageJsonPath = 'package.json';
const skippedExitCode = 10;
const signalSkip = process.argv.includes('--signal-skip');
const versionBumpedEnv = 'REALMFALL_COMMIT_VERSION_BUMPED';

function fail(message) {
  process.stderr.write(`Commit version bump failed: ${message}\n`);
  process.exit(1);
}

function getGitError(result, fallbackMessage) {
  return (result.stderr || result.stdout || fallbackMessage).trim();
}

function runGit(args, { allowFailure = false, cwd = process.cwd() } = {}) {
  const result = spawnSync(gitBin, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (!allowFailure && result.status !== 0) {
    fail(getGitError(result, `git ${args.join(' ')} failed.`));
  }

  return result;
}

function readGit(args, options) {
  return runGit(args, options).stdout.trim();
}

function getStagedFiles(cwd) {
  return readGit(
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
    { cwd },
  )
    .split('\0')
    .filter(Boolean);
}

function hasUnstagedPackageJsonChanges(cwd) {
  const result = runGit(['diff', '--quiet', '--', packageJsonPath], {
    allowFailure: true,
    cwd,
  });

  if (result.status === 0) {
    return false;
  }

  if (result.status === 1) {
    return true;
  }

  fail(getGitError(result, 'git diff --quiet failed.'));
}

function getNextPatchVersion(version) {
  const match = version.match(
    /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)$/u,
  );

  if (!match?.groups) {
    fail(
      `Expected package.json version to use numeric x.y.z format, got "${version}".`,
    );
  }

  return `${match.groups.major}.${match.groups.minor}.${
    Number.parseInt(match.groups.patch, 10) + 1
  }`;
}

if (process.env[versionBumpedEnv] === '1') {
  process.exit(0);
}

if (readGit(['rev-parse', '--is-inside-work-tree']) !== 'true') {
  fail('Current directory is not inside a git worktree.');
}

const repositoryRoot = readGit(['rev-parse', '--show-toplevel']);
const stagedFiles = getStagedFiles(repositoryRoot);

if (stagedFiles.length === 0) {
  process.exit(signalSkip ? skippedExitCode : 0);
}

if (hasUnstagedPackageJsonChanges(repositoryRoot)) {
  fail(
    'package.json has unstaged changes. Stage or stash them before committing so the automatic version bump does not include unrelated edits.',
  );
}

const absolutePackageJsonPath = join(repositoryRoot, packageJsonPath);
const packageJson = JSON.parse(readFileSync(absolutePackageJsonPath, 'utf8'));

if (typeof packageJson.version !== 'string') {
  fail('package.json must contain a string version field.');
}

packageJson.version = getNextPatchVersion(packageJson.version);

writeFileSync(
  absolutePackageJsonPath,
  `${JSON.stringify(packageJson, null, 2)}\n`,
  'utf8',
);
runGit(['add', '--', packageJsonPath], { cwd: repositoryRoot });
