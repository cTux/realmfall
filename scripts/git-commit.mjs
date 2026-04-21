import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { resolve } from 'node:path';
import {
  getCommitVersion,
  replacePackageVersion,
} from './git-commit.helpers.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const PACKAGE_JSON_PATH = resolve(process.cwd(), 'package.json');

function fail(message) {
  process.stderr.write(`Git commit helper failed: ${message}\n`);
  process.exit(1);
}

function getGitError(result, fallbackMessage) {
  return (result.stderr || result.stdout || fallbackMessage).trim();
}

function runGit(args, { allowFailure = false, live = false } = {}) {
  const result = spawnSync(gitBin, args, {
    encoding: 'utf8',
    stdio: live ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });

  if (!allowFailure && result.status !== 0) {
    fail(getGitError(result, `git ${args.join(' ')} failed.`));
  }

  return result;
}

function readGit(args) {
  return runGit(args).stdout.trim();
}

function readHeadPackageVersion() {
  const headCheck = runGit(['rev-parse', '--verify', 'HEAD'], {
    allowFailure: true,
  });

  if (headCheck.status !== 0) {
    return null;
  }

  const headPackage = runGit(['show', 'HEAD:package.json'], {
    allowFailure: true,
  });

  if (headPackage.status !== 0) {
    return null;
  }

  return JSON.parse(headPackage.stdout).version;
}

function updatePackageVersion() {
  const packageJsonText = readFileSync(PACKAGE_JSON_PATH, 'utf8');
  const packageJson = JSON.parse(packageJsonText);
  const headVersion = readHeadPackageVersion();
  const nextVersion = getCommitVersion(packageJson.version, headVersion);

  if (nextVersion === packageJson.version) {
    runGit(['add', 'package.json']);
    return nextVersion;
  }

  writeFileSync(
    PACKAGE_JSON_PATH,
    replacePackageVersion(packageJsonText, nextVersion),
    'utf8',
  );
  runGit(['add', 'package.json']);

  return nextVersion;
}

if (readGit(['rev-parse', '--is-inside-work-tree']) !== 'true') {
  fail('Current directory is not inside a git worktree.');
}

const nextVersion = updatePackageVersion();
console.log(`\n> package.json version prepared for commit: ${nextVersion}`);

const commitResult = runGit(['commit', ...process.argv.slice(2)], {
  allowFailure: true,
  live: true,
});

process.exit(commitResult.status ?? 1);
