import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createDeployBuildEnvironment,
  createPagesPushPlan,
  DEPLOY_BASE_PATH,
  DEPLOY_BRANCH,
  DEPLOY_REMOTE,
  ensureNoJekyllFile,
  getDirtyStatusLines,
  getDeployCommitMessage,
  getDeployWorktreeBranchName,
  getViteBasePath,
  parseCliArgs,
} from '../git-deploy.helpers.mjs';

describe('git deploy helpers', () => {
  function runGit(cwd: string, args: string[]) {
    const environment = { ...process.env };

    delete environment.GIT_DIR;
    delete environment.GIT_WORK_TREE;
    delete environment.GIT_INDEX_FILE;
    delete environment.GIT_PREFIX;

    const result = spawnSync('git', args, {
      cwd,
      env: environment,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
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

    return result.stdout.trim();
  }

  it('parses supported CLI flags', () => {
    expect(parseCliArgs([])).toEqual({
      allowDirty: false,
      dryRun: false,
      help: false,
    });
    expect(parseCliArgs(['--allow-dirty', '--dry-run'])).toEqual({
      allowDirty: true,
      dryRun: true,
      help: false,
    });
    expect(parseCliArgs(['--help'])).toEqual({
      allowDirty: false,
      dryRun: false,
      help: true,
    });
    expect(() => parseCliArgs(['--wat'])).toThrow(
      'Unsupported argument: --wat',
    );
  });

  it('creates a GitHub Pages Vite build environment without mutating the input', () => {
    const input = {
      NODE_ENV: 'development',
      REALMFALL_VITE_BASE: '/old/',
    };

    expect(createDeployBuildEnvironment(input)).toEqual({
      NODE_ENV: 'development',
      REALMFALL_VITE_BASE: DEPLOY_BASE_PATH,
    });
    expect(input.REALMFALL_VITE_BASE).toBe('/old/');
  });

  it('filters clean git status output', () => {
    expect(getDirtyStatusLines('')).toEqual([]);
    expect(getDirtyStatusLines('  \n')).toEqual([]);
    expect(getDirtyStatusLines(' M package.json\n?? scratch.txt\n')).toEqual([
      'M package.json',
      '?? scratch.txt',
    ]);
  });

  it('creates deterministic deploy commit messages', () => {
    expect(getDeployCommitMessage('e81c98b5baadf00d')).toBe(
      'deploy: publish e81c98b',
    );
  });

  it('creates a temporary publish branch name that avoids an existing gh-pages branch', async () => {
    const repositoryDirectory = await mkdtemp(
      join(tmpdir(), 'realmfall-git-deploy-repo-'),
    );
    const worktreeDirectory = await mkdtemp(
      join(tmpdir(), 'realmfall-git-deploy-worktree-'),
    );

    try {
      runGit(repositoryDirectory, ['init', '--initial-branch=main']);
      runGit(repositoryDirectory, ['config', 'user.name', 'Realmfall Tests']);
      runGit(repositoryDirectory, [
        'config',
        'user.email',
        'realmfall-tests@example.com',
      ]);
      await writeFile(join(repositoryDirectory, 'README.md'), 'deploy test\n');
      runGit(repositoryDirectory, ['add', 'README.md']);
      runGit(repositoryDirectory, ['commit', '-m', 'init']);
      runGit(repositoryDirectory, ['branch', DEPLOY_BRANCH]);

      const sourceCommit = runGit(repositoryDirectory, ['rev-parse', 'HEAD']);
      const publishBranch = getDeployWorktreeBranchName(sourceCommit);

      expect(publishBranch).not.toBe(DEPLOY_BRANCH);

      runGit(repositoryDirectory, [
        'worktree',
        'add',
        '--detach',
        worktreeDirectory,
      ]);

      expect(() =>
        runGit(repositoryDirectory, [
          '-C',
          worktreeDirectory,
          'checkout',
          '--orphan',
          publishBranch,
        ]),
      ).not.toThrow();
    } finally {
      try {
        runGit(repositoryDirectory, [
          'worktree',
          'remove',
          '--force',
          worktreeDirectory,
        ]);
      } catch {
        // Ignore teardown failures so the temporary directories still get removed.
      }

      await rm(worktreeDirectory, { force: true, recursive: true });
      await rm(repositoryDirectory, { force: true, recursive: true });
    }
  });

  it('creates a lease-aware gh-pages push plan', () => {
    expect(createPagesPushPlan(true)).toEqual({
      branchName: DEPLOY_BRANCH,
      fetchArgs: [
        'fetch',
        DEPLOY_REMOTE,
        `refs/heads/${DEPLOY_BRANCH}:refs/remotes/${DEPLOY_REMOTE}/${DEPLOY_BRANCH}`,
      ],
      pushArgs: [
        'push',
        '--force-with-lease',
        DEPLOY_REMOTE,
        `HEAD:refs/heads/${DEPLOY_BRANCH}`,
      ],
      remote: DEPLOY_REMOTE,
    });
    expect(createPagesPushPlan(false)).toEqual({
      branchName: DEPLOY_BRANCH,
      fetchArgs: null,
      pushArgs: [
        'push',
        '--set-upstream',
        DEPLOY_REMOTE,
        `HEAD:refs/heads/${DEPLOY_BRANCH}`,
      ],
      remote: DEPLOY_REMOTE,
    });
  });

  it('writes .nojekyll into the publish directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'realmfall-git-deploy-'));

    try {
      await ensureNoJekyllFile(directory);

      await expect(
        readFile(join(directory, '.nojekyll'), 'utf8'),
      ).resolves.toBe('');
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it('normalizes Vite base paths for deployment builds', () => {
    expect(getViteBasePath({})).toBe('/');
    expect(getViteBasePath({ REALMFALL_VITE_BASE: '/realmfall/' })).toBe(
      '/realmfall/',
    );
    expect(getViteBasePath({ REALMFALL_VITE_BASE: 'realmfall' })).toBe(
      '/realmfall/',
    );
  });
});
