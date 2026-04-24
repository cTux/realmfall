import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const commitVersionBumpScriptPath = fileURLToPath(
  new URL('./commit-version-bump.mjs', import.meta.url),
);
const skippedVersionBumpExitCode = 10;
const versionBumpedEnv = 'REALMFALL_COMMIT_VERSION_BUMPED';

function fail(message) {
  process.stderr.write(`Git commit helper failed: ${message}\n`);
  process.exit(1);
}

function getGitError(result, fallbackMessage) {
  return (result.stderr || result.stdout || fallbackMessage).trim();
}

function runGit(args, { allowFailure = false, env, live = false } = {}) {
  const result = spawnSync(gitBin, args, {
    encoding: 'utf8',
    env,
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

function runVersionBump() {
  const env = { ...process.env };
  delete env[versionBumpedEnv];

  const result = spawnSync(
    process.execPath,
    [commitVersionBumpScriptPath, '--signal-skip'],
    {
      encoding: 'utf8',
      env,
      stdio: 'inherit',
    },
  );

  if (result.status === skippedVersionBumpExitCode) {
    return false;
  }

  if (result.status !== 0) {
    fail('version bump failed before commit.');
  }

  return true;
}

if (readGit(['rev-parse', '--is-inside-work-tree']) !== 'true') {
  fail('Current directory is not inside a git worktree.');
}

const versionBumped = runVersionBump();
const commitEnv = { ...process.env };

if (versionBumped) {
  commitEnv[versionBumpedEnv] = '1';
} else {
  delete commitEnv[versionBumpedEnv];
}

const commitResult = runGit(['commit', ...process.argv.slice(2)], {
  allowFailure: true,
  env: commitEnv,
  live: true,
});

process.exit(commitResult.status ?? 1);
