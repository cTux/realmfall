import { mkdtemp, readFile, rm } from 'node:fs/promises';
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
  getViteBasePath,
  parseCliArgs,
} from '../git-deploy.helpers.mjs';

describe('git deploy helpers', () => {
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
