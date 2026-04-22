import { spawnSync } from 'node:child_process';
import process from 'node:process';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';

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

if (readGit(['rev-parse', '--is-inside-work-tree']) !== 'true') {
  fail('Current directory is not inside a git worktree.');
}

const commitResult = runGit(['commit', ...process.argv.slice(2)], {
  allowFailure: true,
  live: true,
});

process.exit(commitResult.status ?? 1);
