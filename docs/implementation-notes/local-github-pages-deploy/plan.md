# Local GitHub Pages Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `pnpm git:deploy` so a maintainer can build Realmfall locally and publish the generated static site to GitHub Pages.

**Architecture:** Use a thin executable script backed by pure helper functions. The runner performs git and filesystem operations directly, while helper tests cover argument parsing, clean-worktree protection, GitHub Pages build environment, publish file preparation, and push planning.

**Tech Stack:** Node ESM scripts, pnpm, Vite, Git worktrees, Vitest node project.

---

### File Structure

- Create `scripts/git-deploy.helpers.mjs`: pure deploy constants and helper functions for parsing CLI flags, reading git status, creating the Vite build environment, preparing `.nojekyll`, and producing the gh-pages push plan.
- Create `scripts/git-deploy.helpers.d.mts`: TypeScript declarations for the `.mjs` helper import used by `vite.config.ts`.
- Create `scripts/git-deploy.mjs`: executable runner that uses existing `spawnManagedChild` and `createPnpmInvocation` helpers to build, publish, commit, and push.
- Create `scripts/tests/git-deploy.test.ts`: focused node-project tests for the helper behavior.
- Modify `package.json`: add `"git:deploy": "node scripts/git-deploy.mjs"`.
- Modify `docs/WORKFLOW.md`: document the local deploy command and the required GitHub Pages branch setting.
- Modify `docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md`: record the shipped local deploy automation in the technical tooling spec.

### Task 1: Add Deploy Helpers And Tests

**Files:**

- Create: `scripts/git-deploy.helpers.mjs`
- Create: `scripts/tests/git-deploy.test.ts`

- [x] **Step 1: Write helper tests**

Create `scripts/tests/git-deploy.test.ts`:

```ts
import {
  createDeployBuildEnvironment,
  createPagesPushPlan,
  DEPLOY_BASE_PATH,
  DEPLOY_BRANCH,
  DEPLOY_REMOTE,
  ensureNoJekyllFile,
  getDirtyStatusLines,
  getDeployCommitMessage,
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
    const directory = await import('node:fs/promises').then((fs) =>
      fs.mkdtemp(new URL('./git-deploy-', import.meta.url)),
    );

    await ensureNoJekyllFile(directory);

    await expect(
      import('node:fs/promises').then((fs) =>
        fs.readFile(new URL('.nojekyll', `file://${directory}/`), 'utf8'),
      ),
    ).resolves.toBe('');
  });
});
```

- [x] **Step 2: Run helper tests to verify they fail**

Run: `pnpm test:node -- scripts/tests/git-deploy.test.ts`

Expected: FAIL because `scripts/git-deploy.helpers.mjs` does not exist.

- [x] **Step 3: Implement helper module**

Create `scripts/git-deploy.helpers.mjs`:

```js
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

export function getDirtyStatusLines(statusOutput) {
  return statusOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getDeployCommitMessage(sourceCommit) {
  return `deploy: publish ${sourceCommit.slice(0, 7)}`;
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
```

- [x] **Step 4: Run helper tests to verify they pass**

Run: `pnpm test:node -- scripts/tests/git-deploy.test.ts`

Expected: PASS for the new helper suite.

### Task 2: Add Runner, Vite Base Support, And Script Wiring

**Files:**

- Create: `scripts/git-deploy.mjs`
- Create: `scripts/git-deploy.helpers.d.mts`
- Modify: `vite.config.ts`
- Modify: `package.json`
- Modify: `scripts/tests/git-deploy.test.ts`
- Modify: `scripts/git-deploy.helpers.mjs`

- [x] **Step 1: Add tests for build base normalization**

Extend `scripts/tests/git-deploy.test.ts` with:

```ts
import { getViteBasePath } from '../git-deploy.helpers.mjs';

it('normalizes Vite base paths for deployment builds', () => {
  expect(getViteBasePath({})).toBe('/');
  expect(getViteBasePath({ REALMFALL_VITE_BASE: '/realmfall/' })).toBe(
    '/realmfall/',
  );
  expect(getViteBasePath({ REALMFALL_VITE_BASE: 'realmfall' })).toBe(
    '/realmfall/',
  );
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `pnpm test:node -- scripts/tests/git-deploy.test.ts`

Expected: FAIL because `getViteBasePath` is not exported.

- [x] **Step 3: Implement base helper and wire Vite**

Add to `scripts/git-deploy.helpers.mjs`:

```js
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
```

Modify `vite.config.ts` to import and use the helper:

```ts
import { getViteBasePath } from './scripts/git-deploy.helpers.mjs';
```

Add this top-level config property:

```ts
  base: getViteBasePath(),
```

- [x] **Step 4: Add deploy runner**

Create `scripts/git-deploy.mjs`:

```js
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  createDeployBuildEnvironment,
  createPagesPushPlan,
  DEPLOY_BRANCH,
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

Build Realmfall locally and publish dist/ to origin/${DEPLOY_BRANCH}.

Options:
  --allow-dirty  Allow deployment when tracked files have uncommitted changes.
  --dry-run      Print the deploy steps without changing branches or pushing.
  -h, --help     Show this help text.`);
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error(
      [`git ${args.join(' ')} failed.`, result.stderr, result.stdout]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return result.stdout.trim();
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
      `Would build with REALMFALL_VITE_BASE=/realmfall/ and publish ${sourceCommit.slice(
        0,
        7,
      )} to origin/${DEPLOY_BRANCH}.`,
    );
    return;
  }

  await runPnpm(['build'], createDeployBuildEnvironment(process.env));
  await ensureNoJekyllFile(distDirectory);

  const publishWorktree = await mkdtemp(join(tmpdir(), 'realmfall-pages-'));

  try {
    const remoteBranchExists =
      spawnSync(
        'git',
        ['ls-remote', '--exit-code', '--heads', 'origin', DEPLOY_BRANCH],
        {
          cwd: repositoryRoot,
          stdio: 'ignore',
          windowsHide: true,
        },
      ).status === 0;
    const pushPlan = createPagesPushPlan(remoteBranchExists);

    if (pushPlan.fetchArgs) {
      runGit(pushPlan.fetchArgs, { stdio: 'inherit' });
    }

    runGit(['worktree', 'add', '--detach', publishWorktree], {
      stdio: 'inherit',
    });
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
    runGit(['-C', publishWorktree, ...pushPlan.pushArgs], { stdio: 'inherit' });
  } finally {
    runGit(['worktree', 'remove', '--force', publishWorktree], {
      stdio: 'inherit',
    });
    await rm(publishWorktree, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
```

- [x] **Step 5: Wire package script**

Add to `package.json` scripts:

```json
"git:deploy": "node scripts/git-deploy.mjs",
```

- [x] **Step 6: Run targeted tests**

Run: `pnpm test:node -- scripts/tests/git-deploy.test.ts scripts/tests/run-vite-build.test.ts`

Expected: PASS.

### Task 3: Document And Verify

**Files:**

- Modify: `docs/WORKFLOW.md`
- Modify: `docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md`

- [x] **Step 1: Document deploy workflow**

Add a concise bullet to `docs/WORKFLOW.md` under the daily or verification workflow:

```md
- Use `pnpm git:deploy` from a clean tracked worktree to build the app with the GitHub Pages base path and publish `dist/` to `origin/gh-pages`. Configure GitHub Pages to serve the `gh-pages` branch from `/`.
```

- [x] **Step 2: Update technical tooling spec**

Add a concise bullet to `docs/specs/reference/technical-solutions/testing-and-quality-tooling/spec.md` describing the shipped local deploy helper:

```md
- `pnpm git:deploy` builds the Vite app with the `/realmfall/` GitHub Pages base path, writes `.nojekyll`, publishes the generated `dist/` contents through a temporary `gh-pages` worktree, and pushes with a lease-aware plan when the remote branch already exists.
```

- [x] **Step 3: Run verification**

Run:

```bash
pnpm test:node -- scripts/tests/git-deploy.test.ts scripts/tests/run-vite-build.test.ts
pnpm build
pnpm git:deploy -- --dry-run
```

Expected:

- Tests pass.
- Build completes and emits `dist/`.
- Dry run prints the source commit and `origin/gh-pages` target without pushing.
