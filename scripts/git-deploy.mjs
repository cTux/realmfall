import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  createDeployBuildEnvironment,
  createPagesPushPlan,
  DEPLOY_BASE_PATH,
  DEPLOY_BRANCH,
  DEPLOY_REMOTE,
  ensureNoJekyllFile,
  getDeployCommitMessage,
  getDirtyStatusLines,
  parseCliArgs,
} from './git-deploy.helpers.mjs';
import { spawnManagedChild } from './managed-child-process.mjs';
import { createPnpmInvocation } from './pnpm-command.mjs';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const distDirectory = join(repositoryRoot, 'dist');

function printUsage() {
  console.log(`Usage: pnpm git:deploy [--allow-dirty] [--dry-run]

Build Realmfall locally and publish dist/ to ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}.

Options:
  --allow-dirty  Allow deployment when tracked files have uncommitted changes.
  --dry-run      Print the deploy target without building or pushing.
  -h, --help     Show this help text.`);
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      [`git ${args.join(' ')} failed.`, result.stderr, result.stdout]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return typeof result.stdout === 'string' ? result.stdout.trim() : '';
}

function remoteDeployBranchExists() {
  const result = spawnSync(
    'git',
    ['ls-remote', '--exit-code', '--heads', DEPLOY_REMOTE, DEPLOY_BRANCH],
    {
      cwd: repositoryRoot,
      stdio: 'ignore',
      windowsHide: true,
    },
  );

  if (result.error) {
    throw result.error;
  }

  return result.status === 0;
}

function runPnpm(args, environment) {
  const invocation = createPnpmInvocation(args, environment);
  const child = spawnManagedChild(invocation.command, invocation.args, {
    cwd: repositoryRoot,
    env: environment,
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(
          new Error(`pnpm ${args.join(' ')} exited with signal ${signal}.`),
        );
        return;
      }

      if (code !== 0) {
        reject(new Error(`pnpm ${args.join(' ')} exited with code ${code}.`));
        return;
      }

      resolve();
    });
  });
}

async function publishDistToPages(sourceCommit) {
  await ensureNoJekyllFile(distDirectory);

  const publishWorktree = await mkdtemp(join(tmpdir(), 'realmfall-pages-'));
  let worktreeAdded = false;

  try {
    const pushPlan = createPagesPushPlan(remoteDeployBranchExists());

    if (pushPlan.fetchArgs) {
      runGit(pushPlan.fetchArgs, { stdio: 'inherit' });
    }

    runGit(['worktree', 'add', '--detach', publishWorktree], {
      stdio: 'inherit',
    });
    worktreeAdded = true;
    runGit(['-C', publishWorktree, 'checkout', '--orphan', DEPLOY_BRANCH], {
      stdio: 'inherit',
    });
    runGit(['-C', publishWorktree, 'rm', '-rf', '.'], { stdio: 'ignore' });

    await cp(distDirectory, publishWorktree, {
      force: true,
      recursive: true,
    });

    runGit(['-C', publishWorktree, 'add', '.'], { stdio: 'inherit' });
    runGit(
      [
        '-C',
        publishWorktree,
        'commit',
        '-m',
        getDeployCommitMessage(sourceCommit),
      ],
      { stdio: 'inherit' },
    );
    runGit(['-C', publishWorktree, ...pushPlan.pushArgs], {
      stdio: 'inherit',
    });
  } finally {
    if (worktreeAdded) {
      runGit(['worktree', 'remove', '--force', publishWorktree], {
        stdio: 'inherit',
      });
    }

    await rm(publishWorktree, { force: true, recursive: true });
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const sourceCommit = runGit(['rev-parse', 'HEAD']);
  const dirtyLines = getDirtyStatusLines(
    runGit(['status', '--porcelain', '--untracked-files=no']),
  );

  if (!options.allowDirty && dirtyLines.length > 0) {
    throw new Error(
      [
        'Refusing to deploy with uncommitted tracked changes:',
        ...dirtyLines.map((line) => `  ${line}`),
        'Commit, stash, or rerun with --allow-dirty.',
      ].join('\n'),
    );
  }

  if (options.dryRun) {
    console.log(
      `Would build with REALMFALL_VITE_BASE=${DEPLOY_BASE_PATH} and publish ${sourceCommit.slice(
        0,
        7,
      )} to ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}.`,
    );
    return;
  }

  await runPnpm(['build'], createDeployBuildEnvironment(process.env));
  await publishDistToPages(sourceCommit);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
