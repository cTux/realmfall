import { spawnSync } from 'node:child_process';
import process from 'node:process';
import {
  formatUpstreamRef,
  getGoneBranches,
  parseBranchRecords,
  parseCliArgs,
  parseRemoteRefs,
} from './prune-gone-branches.helpers.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const USAGE = `Usage: pnpm git:prune-gone-branches [-- --dry-run] [-- --safe] [-- --no-fetch]

Deletes local branches whose tracked remote branch no longer exists.

Options:
  --dry-run  Show branches that would be deleted without removing them
  --safe     Use git branch -d instead of the default git branch -D
  --no-fetch Skip git fetch --all --prune --prune-tags before scanning`;

function fail(message) {
  process.stderr.write(`Git branch cleanup failed: ${message}\n`);
  process.exit(1);
}

function logStep(message) {
  console.log(`\n> ${message}`);
}

function runGit(args, { allowFailure = false } = {}) {
  const result = spawnSync(gitBin, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (!allowFailure && result.status !== 0) {
    const details = (
      result.stderr ||
      result.stdout ||
      'Unknown git error'
    ).trim();
    fail(details);
  }

  return result;
}

function readGit(args) {
  return runGit(args).stdout;
}

function printBranches(branches) {
  for (const branch of branches) {
    console.log(`- ${branch.name} (${formatUpstreamRef(branch.upstreamRef)})`);
  }
}

function deleteBranches(branches, deleteFlag) {
  const deleted = [];
  const failed = [];

  for (const branch of branches) {
    const result = runGit(['branch', deleteFlag, branch.name], {
      allowFailure: true,
    });

    if (result.status === 0) {
      deleted.push(branch);
      continue;
    }

    failed.push({
      branch,
      reason: (result.stderr || result.stdout || 'Unknown git error').trim(),
    });
  }

  return {
    deleted,
    failed,
  };
}

let options;

try {
  options = parseCliArgs(process.argv.slice(2));
} catch (error) {
  console.error(USAGE);
  fail(error instanceof Error ? error.message : String(error));
}

if (options.help) {
  console.log(USAGE);
  process.exit(0);
}

if (readGit(['rev-parse', '--is-inside-work-tree']).trim() !== 'true') {
  fail('Current directory is not inside a git worktree.');
}

if (options.fetch) {
  logStep('Fetching all remotes with prune');

  const fetchResult = runGit(['fetch', '--all', '--prune', '--prune-tags'], {
    allowFailure: true,
  });

  if (fetchResult.status !== 0) {
    fail(
      (fetchResult.stderr || fetchResult.stdout || 'Unknown git error').trim(),
    );
  }
}

const localBranches = parseBranchRecords(
  readGit([
    'for-each-ref',
    '--format=%(refname:short)%00%(upstream)%00%(HEAD)',
    'refs/heads',
  ]),
);
const remoteRefs = parseRemoteRefs(
  readGit(['for-each-ref', '--format=%(refname)', 'refs/remotes']),
);
const goneBranches = getGoneBranches(localBranches, remoteRefs);

if (goneBranches.length === 0) {
  logStep('No local branches track deleted remote refs');
  process.exit(0);
}

logStep(
  `${options.dryRun ? 'Found' : 'Pruning'} ${goneBranches.length} local branch(es) with deleted upstream refs`,
);
printBranches(goneBranches);

if (options.dryRun) {
  process.exit(0);
}

const deleteFlag = options.force ? '-D' : '-d';
const { deleted, failed } = deleteBranches(goneBranches, deleteFlag);

if (deleted.length > 0) {
  logStep(`Deleted ${deleted.length} local branch(es)`);
  printBranches(deleted);
}

if (failed.length === 0) {
  process.exit(0);
}

process.stderr.write(
  `\nGit branch cleanup could not delete ${failed.length} branch(es):\n`,
);

for (const failure of failed) {
  process.stderr.write(`- ${failure.branch.name}: ${failure.reason}\n`);
}

if (!options.force) {
  process.stderr.write(
    'Re-run without --safe to bypass Git merge safety checks for the remaining branches.\n',
  );
}

process.exit(1);
