import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const DEPLOY_BASE_PATH = '/realmfall/';
export const DEPLOY_BRANCH = 'gh-pages';
export const DEPLOY_REMOTE = 'origin';

export function parseCliArgs(argv) {
  const options = {
    allowDirty: false,
    dryRun: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--allow-dirty') {
      options.allowDirty = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    throw new Error(`Unsupported argument: ${arg}`);
  }

  return options;
}

export function createDeployBuildEnvironment(environment = process.env) {
  return {
    ...environment,
    REALMFALL_VITE_BASE: DEPLOY_BASE_PATH,
  };
}

export function getViteBasePath(environment = process.env) {
  const basePath = environment.REALMFALL_VITE_BASE;

  if (!basePath) {
    return '/';
  }

  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;

  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export function getDirtyStatusLines(statusOutput) {
  return statusOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getDeployCommitMessage(sourceCommit) {
  return `deploy: publish ${sourceCommit.slice(0, 7)}`;
}

export function getDeployWorktreeBranchName(sourceCommit) {
  return `realmfall-pages-publish-${sourceCommit.slice(0, 7)}`;
}

export function createPagesPushPlan(
  hasRemoteTrackingRef,
  remote = DEPLOY_REMOTE,
  branchName = DEPLOY_BRANCH,
) {
  const remoteHeadRef = `refs/heads/${branchName}`;

  if (hasRemoteTrackingRef) {
    return {
      branchName,
      fetchArgs: [
        'fetch',
        remote,
        `${remoteHeadRef}:refs/remotes/${remote}/${branchName}`,
      ],
      pushArgs: ['push', '--force-with-lease', remote, `HEAD:${remoteHeadRef}`],
      remote,
    };
  }

  return {
    branchName,
    fetchArgs: null,
    pushArgs: ['push', '--set-upstream', remote, `HEAD:${remoteHeadRef}`],
    remote,
  };
}

export async function ensureNoJekyllFile(publishDirectory) {
  await writeFile(join(publishDirectory, '.nojekyll'), '');
}
