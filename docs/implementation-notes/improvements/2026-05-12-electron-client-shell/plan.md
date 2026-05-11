# Electron Thin Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an initial `@realmfall/client-electron` package that runs the existing web client inside Electron with minimal renderer divergence.

**Architecture:** The Electron package stays thin. It owns a main-process lifecycle, a minimal preload boundary, and a localhost static server for the built `client-web` bundle so the browser client can keep its existing HTTP-origin assumptions for locale assets and `version.json`. React Native scaffolding and desktop filesystem saves are explicitly out of scope for this plan.

**Tech Stack:** pnpm workspace, Turbo, TypeScript, Electron, tsx, Vitest, existing `@realmfall/client-web` Vite build output

---

## Scope Check

This plan intentionally covers only the first independent subsystem from the approved design:

- In scope: the thin Electron shell package, workspace command wiring, verification, and current-system docs/spec updates.
- Out of scope: desktop filesystem-backed save storage, Steam Cloud sync, and the future React Native package.

Those deferred items should each get their own follow-on plan after the shell ships.

## File Structure

### New package

- Create: `packages/client-electron/package.json`
  - Workspace manifest, scripts, Electron dependency, and package metadata.
- Create: `packages/client-electron/tsconfig.json`
  - Local typecheck config for Node/Electron runtime code and Vitest globals.
- Create: `packages/client-electron/tsconfig.build.json`
  - Emission config for `dist/**`.
- Create: `packages/client-electron/vitest.config.ts`
  - Node test runner for Electron package tests.
- Create: `packages/client-electron/src/runtimeConfig.ts`
  - Pure config and path resolution for dev URL, built client-web dist directory, preload path, and localhost port selection.
- Create: `packages/client-electron/src/staticServer.ts`
  - Tiny localhost static server for the built `client-web/dist` output.
- Create: `packages/client-electron/src/window.ts`
  - BrowserWindow factory helpers and secure window options.
- Create: `packages/client-electron/src/mainProcess.ts`
  - Testable lifecycle orchestration for app readiness, server startup, window creation, and shutdown.
- Create: `packages/client-electron/src/main.ts`
  - Production entrypoint that boots the built-client localhost server path.
- Create: `packages/client-electron/src/dev.ts`
  - Dev entrypoint that targets the `client-web` Vite server URL.
- Create: `packages/client-electron/src/preload.ts`
  - Minimal preload bridge with no Node exposure in the renderer.
- Create: `packages/client-electron/src/__tests__/runtimeConfig.spec.test.ts`
  - Unit tests for dev and production config resolution.
- Create: `packages/client-electron/src/__tests__/staticServer.spec.test.ts`
  - Unit tests for localhost serving of `index.html`, nested assets, and `version.json`.
- Create: `packages/client-electron/src/__tests__/window.spec.test.ts`
  - Unit tests for secure BrowserWindow options and renderer URL selection.
- Create: `packages/client-electron/src/__tests__/mainProcess.spec.test.ts`
  - Unit tests for lifecycle orchestration with mocked Electron APIs.

### Workspace and docs updates

- Modify: `pnpm-workspace.yaml`
  - Add the Electron catalog entry used by the new package.
- Modify: `package.json`
  - Add root aliases for Electron build, start, typecheck, lint, and test commands without changing the existing `pnpm dev` workflow.
- Modify: `README.md`
  - Add the Electron package to the repository layout and common commands.
- Modify: `packages/client-web/README.md`
  - Clarify that Electron hosts `client-web` unchanged in phase one.
- Modify: `docs/specs/reference/technical-solutions/README.md`
  - Add the new Electron technical-solution spec link.
- Create: `docs/specs/reference/technical-solutions/desktop-client-shell/spec.md`
  - Canonical current-system spec for the shipped desktop shell.
- Modify: `docs/specs/reference/technical-solutions/application-architecture/spec.md`
  - Add `packages/client-electron` as a thin shell package boundary.
- Modify: `docs/specs/reference/technical-solutions/version-checking/spec.md`
  - Record that the Electron shell preserves `version.json` by serving the built client on localhost.

## Task 1: Scaffold The Electron Workspace Package

**Files:**

- Create: `packages/client-electron/package.json`
- Create: `packages/client-electron/tsconfig.json`
- Create: `packages/client-electron/tsconfig.build.json`
- Create: `packages/client-electron/vitest.config.ts`
- Create: `packages/client-electron/src/__tests__/runtimeConfig.spec.test.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json`

- [ ] **Step 1: Write the package scaffold and the first failing config test**

```json
// packages/client-electron/package.json
{
  "name": "@realmfall/client-electron",
  "version": "1.0.0",
  "description": "Thin Electron shell for the Realmfall web client.",
  "private": true,
  "type": "module",
  "main": "./dist/main.js",
  "types": "./dist/main.d.ts",
  "scripts": {
    "dev": "tsx src/dev.ts",
    "build": "tsc -p ./tsconfig.build.json",
    "start": "electron ./dist/main.js",
    "typecheck": "tsc -p ./tsconfig.json --noEmit",
    "lint": "oxlint -c ../../.oxlintrc.json src vitest.config.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "electron": "^42.0.1"
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "oxlint": "catalog:",
    "tsx": "^4.21.0",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

```json
// packages/client-electron/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "vitest.config.ts"]
}
```

```json
// packages/client-electron/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "./dist",
    "declaration": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]
}
```

```ts
// packages/client-electron/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.test.ts'],
  },
});
```

```ts
// packages/client-electron/src/__tests__/runtimeConfig.spec.test.ts
import { resolveRuntimeConfig } from '../runtimeConfig';

describe('resolveRuntimeConfig', () => {
  it('returns the dev renderer url without touching the built client path', () => {
    const config = resolveRuntimeConfig({
      appMode: 'development',
      cwd: '/workspace/packages/client-electron',
      rendererDevUrl: 'https://localhost:5173',
    });

    expect(config.mode).toBe('development');
    expect(config.rendererUrl).toBe('https://localhost:5173');
    expect(config.clientWebDistPath.endsWith('/packages/client-web/dist')).toBe(
      true,
    );
    expect(config.preloadPath.endsWith('/dist/preload.js')).toBe(true);
  });
});
```

```yaml
# pnpm-workspace.yaml
catalog:
  electron: ^42.0.1
```

```json
// package.json (add scripts)
{
  "scripts": {
    "dev:electron": "pnpm --filter @realmfall/client-electron dev",
    "build:electron": "pnpm --filter @realmfall/client-electron build",
    "start:electron": "pnpm --filter @realmfall/client-electron start",
    "typecheck:electron": "pnpm --filter @realmfall/client-electron typecheck",
    "lint:electron": "pnpm --filter @realmfall/client-electron lint",
    "test:electron": "pnpm --filter @realmfall/client-electron test"
  }
}
```

- [ ] **Step 2: Run the new package test to verify it fails**

Run: `pnpm --filter @realmfall/client-electron test`

Expected: FAIL with a module-resolution error for `../runtimeConfig`.

- [ ] **Step 3: Write the minimal runtime config implementation**

```ts
// packages/client-electron/src/runtimeConfig.ts
import { resolve } from 'node:path';

export type RuntimeConfigInput = {
  appMode: 'development' | 'production';
  cwd: string;
  rendererDevUrl?: string;
};

export type RuntimeConfig = {
  clientWebDistPath: string;
  mode: 'development' | 'production';
  preloadPath: string;
  rendererUrl: string;
};

export function resolveRuntimeConfig({
  appMode,
  cwd,
  rendererDevUrl = 'https://localhost:5173',
}: RuntimeConfigInput): RuntimeConfig {
  const packageRoot = cwd;
  const repoRoot = resolve(packageRoot, '../..');
  const clientWebDistPath = resolve(repoRoot, 'packages/client-web/dist');

  return {
    clientWebDistPath,
    mode: appMode,
    preloadPath: resolve(packageRoot, 'dist/preload.js'),
    rendererUrl:
      appMode === 'development'
        ? rendererDevUrl
        : 'http://127.0.0.1:43110/index.html',
  };
}
```

- [ ] **Step 4: Run the package test to verify it passes**

Run: `pnpm --filter @realmfall/client-electron test`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit the scaffold**

```bash
git add \
  pnpm-workspace.yaml \
  package.json \
  packages/client-electron/package.json \
  packages/client-electron/tsconfig.json \
  packages/client-electron/tsconfig.build.json \
  packages/client-electron/vitest.config.ts \
  packages/client-electron/src/runtimeConfig.ts \
  packages/client-electron/src/__tests__/runtimeConfig.spec.test.ts
git commit -m "feat: scaffold electron shell workspace package"
```

## Task 2: Serve The Built Web Client Over Localhost

**Files:**

- Create: `packages/client-electron/src/staticServer.ts`
- Create: `packages/client-electron/src/__tests__/staticServer.spec.test.ts`
- Modify: `packages/client-electron/src/runtimeConfig.ts`

- [ ] **Step 1: Write the failing static-server test**

```ts
// packages/client-electron/src/__tests__/staticServer.spec.test.ts
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStaticServer } from '../staticServer';

describe('startStaticServer', () => {
  it('serves the built client index and version payload over localhost', async () => {
    const distDir = await mkdtemp(join(tmpdir(), 'realmfall-electron-'));
    await writeFile(join(distDir, 'index.html'), '<html>shell</html>');
    await writeFile(join(distDir, 'version.json'), '{"version":"test"}');

    const server = await startStaticServer({
      distDir,
      port: 43110,
    });

    try {
      const indexResponse = await fetch('http://127.0.0.1:43110/index.html');
      const versionResponse = await fetch(
        'http://127.0.0.1:43110/version.json',
      );

      expect(await indexResponse.text()).toContain('shell');
      expect(await versionResponse.json()).toEqual({ version: 'test' });
    } finally {
      await server.close();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @realmfall/client-electron test -- staticServer`

Expected: FAIL with a module-resolution error for `../staticServer`.

- [ ] **Step 3: Implement the localhost static server**

```ts
// packages/client-electron/src/staticServer.ts
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

type StaticServerOptions = {
  distDir: string;
  port: number;
};

export type StaticServerHandle = {
  close: () => Promise<void>;
  origin: string;
};

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export async function startStaticServer({
  distDir,
  port,
}: StaticServerOptions): Promise<StaticServerHandle> {
  const server = createServer(async (request, response) => {
    const requestPath =
      request.url && request.url !== '/' ? request.url : '/index.html';
    const normalizedPath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(distDir, normalizedPath);

    if (!existsSync(filePath)) {
      response.statusCode = 404;
      response.end('Not found');
      return;
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.statusCode = 404;
      response.end('Not found');
      return;
    }

    response.setHeader(
      'Content-Type',
      CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
    );
    createReadStream(filePath).pipe(response);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve());
  });

  return {
    origin: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}
```

```ts
// packages/client-electron/src/runtimeConfig.ts (production URL helper)
export const ELECTRON_STATIC_SERVER_PORT = 43110;

// inside resolveRuntimeConfig(...)
rendererUrl:
  appMode === 'development'
    ? rendererDevUrl
    : `http://127.0.0.1:${ELECTRON_STATIC_SERVER_PORT}/index.html`,
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `pnpm --filter @realmfall/client-electron test -- staticServer`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit the static server**

```bash
git add \
  packages/client-electron/src/runtimeConfig.ts \
  packages/client-electron/src/staticServer.ts \
  packages/client-electron/src/__tests__/staticServer.spec.test.ts
git commit -m "feat: serve built web client for electron shell"
```

## Task 3: Add Secure BrowserWindow Construction

**Files:**

- Create: `packages/client-electron/src/window.ts`
- Create: `packages/client-electron/src/__tests__/window.spec.test.ts`
- Modify: `packages/client-electron/src/runtimeConfig.ts`

- [ ] **Step 1: Write the failing window-helper test**

```ts
// packages/client-electron/src/__tests__/window.spec.test.ts
import { buildWindowOptions, resolveWindowTargetUrl } from '../window';
import { resolveRuntimeConfig } from '../runtimeConfig';

describe('window helpers', () => {
  it('builds a hardened BrowserWindow config and uses the renderer url from runtime config', () => {
    const runtimeConfig = resolveRuntimeConfig({
      appMode: 'development',
      cwd: '/workspace/packages/client-electron',
      rendererDevUrl: 'https://localhost:5173',
    });

    expect(resolveWindowTargetUrl(runtimeConfig)).toBe(
      'https://localhost:5173',
    );

    expect(buildWindowOptions(runtimeConfig)).toMatchObject({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: runtimeConfig.preloadPath,
        sandbox: true,
      },
    });
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter @realmfall/client-electron test -- window`

Expected: FAIL with a module-resolution error for `../window`.

- [ ] **Step 3: Implement the BrowserWindow helpers**

```ts
// packages/client-electron/src/window.ts
import type { BrowserWindowConstructorOptions } from 'electron';
import type { RuntimeConfig } from './runtimeConfig';

export function resolveWindowTargetUrl(runtimeConfig: RuntimeConfig) {
  return runtimeConfig.rendererUrl;
}

export function buildWindowOptions(
  runtimeConfig: RuntimeConfig,
): BrowserWindowConstructorOptions {
  return {
    backgroundColor: '#101419',
    height: 900,
    minHeight: 720,
    minWidth: 1280,
    show: false,
    width: 1440,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: runtimeConfig.preloadPath,
      sandbox: true,
    },
  };
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `pnpm --filter @realmfall/client-electron test -- window`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit the window helpers**

```bash
git add \
  packages/client-electron/src/window.ts \
  packages/client-electron/src/__tests__/window.spec.test.ts
git commit -m "feat: add electron window configuration helpers"
```

## Task 4: Orchestrate Electron Lifecycle, Dev Boot, And Preload

**Files:**

- Create: `packages/client-electron/src/mainProcess.ts`
- Create: `packages/client-electron/src/main.ts`
- Create: `packages/client-electron/src/dev.ts`
- Create: `packages/client-electron/src/preload.ts`
- Create: `packages/client-electron/src/__tests__/mainProcess.spec.test.ts`

- [ ] **Step 1: Write the failing main-process orchestration test**

```ts
// packages/client-electron/src/__tests__/mainProcess.spec.test.ts
import { createMainProcessController } from '../mainProcess';

describe('createMainProcessController', () => {
  it('starts the static server in production and creates one BrowserWindow', async () => {
    const createdWindows: Array<{ loadURL: ReturnType<typeof vi.fn> }> = [];
    const loadURL = vi.fn();
    const once = vi.fn((_event, callback: () => void) => callback());

    const BrowserWindow = vi.fn(() => {
      const window = {
        loadURL,
        once,
        show: vi.fn(),
      };
      createdWindows.push(window);
      return window;
    });

    const startServer = vi.fn().mockResolvedValue({
      close: vi.fn(),
      origin: 'http://127.0.0.1:43110',
    });

    const controller = createMainProcessController({
      BrowserWindow,
      app: {
        on: vi.fn(),
        whenReady: vi.fn().mockResolvedValue(undefined),
      },
      startStaticServer: startServer,
    });

    await controller.start({
      appMode: 'production',
      cwd: '/workspace/packages/client-electron',
    });

    expect(startServer).toHaveBeenCalledTimes(1);
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(loadURL).toHaveBeenCalledWith('http://127.0.0.1:43110/index.html');
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter @realmfall/client-electron test -- mainProcess`

Expected: FAIL with a module-resolution error for `../mainProcess`.

- [ ] **Step 3: Implement the lifecycle controller and entrypoints**

```ts
// packages/client-electron/src/mainProcess.ts
import { app, BrowserWindow } from 'electron';
import {
  resolveRuntimeConfig,
  ELECTRON_STATIC_SERVER_PORT,
} from './runtimeConfig';
import { startStaticServer } from './staticServer';
import { buildWindowOptions, resolveWindowTargetUrl } from './window';

type StartOptions = {
  appMode: 'development' | 'production';
  cwd: string;
  rendererDevUrl?: string;
};

export function createMainProcessController(
  deps = { app, BrowserWindow, startStaticServer },
) {
  let serverHandle: Awaited<ReturnType<typeof startStaticServer>> | null = null;

  return {
    async start(options: StartOptions) {
      const runtimeConfig = resolveRuntimeConfig(options);

      await deps.app.whenReady();

      if (runtimeConfig.mode === 'production') {
        serverHandle = await deps.startStaticServer({
          distDir: runtimeConfig.clientWebDistPath,
          port: ELECTRON_STATIC_SERVER_PORT,
        });
        runtimeConfig.rendererUrl = `${serverHandle.origin}/index.html`;
      }

      const window = new deps.BrowserWindow(buildWindowOptions(runtimeConfig));
      window.once('ready-to-show', () => window.show());
      await window.loadURL(resolveWindowTargetUrl(runtimeConfig));

      deps.app.on('window-all-closed', async () => {
        await serverHandle?.close();
        if (process.platform !== 'darwin') {
          deps.app.quit();
        }
      });
    },
  };
}
```

```ts
// packages/client-electron/src/main.ts
import { createMainProcessController } from './mainProcess';

await createMainProcessController().start({
  appMode:
    process.env.REALMFALL_ELECTRON_APP_MODE === 'development'
      ? 'development'
      : 'production',
  cwd: process.cwd(),
  rendererDevUrl: process.env.REALMFALL_ELECTRON_RENDERER_URL,
});
```

```ts
// packages/client-electron/src/dev.ts
import { spawn } from 'node:child_process';
import process from 'node:process';

function run(command: string, args: string[], env = process.env) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      shell: false,
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if ((code ?? 1) !== 0) {
        reject(new Error(`${command} exited with code ${code ?? 1}`));
        return;
      }

      resolve();
    });
  });
}

async function waitForUrl(url: string, timeoutMs = 30_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling until the dev server is ready
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

await run('pnpm', ['--filter', '@realmfall/client-electron', 'build']);

const rendererUrl =
  process.env.REALMFALL_ELECTRON_RENDERER_URL ?? 'https://localhost:5173';

const clientWeb = spawn('pnpm', ['--filter', '@realmfall/client-web', 'dev'], {
  env: process.env,
  shell: false,
  stdio: 'inherit',
});

await waitForUrl(`${rendererUrl}/version.json`);

const electron = spawn('pnpm', ['exec', 'electron', './dist/main.js'], {
  env: {
    ...process.env,
    REALMFALL_ELECTRON_APP_MODE: 'development',
    REALMFALL_ELECTRON_RENDERER_URL: rendererUrl,
  },
  shell: false,
  stdio: 'inherit',
});

electron.once('exit', (code) => {
  clientWeb.kill();
  process.exit(code ?? 0);
});
```

```ts
// packages/client-electron/src/preload.ts
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('realmfallDesktop', Object.freeze({}));
```

- [ ] **Step 4: Run focused tests and do the manual boot smoke checks**

Run: `pnpm --filter @realmfall/client-electron test -- mainProcess`

Expected: PASS with `1 passed`.

Run: `pnpm --filter @realmfall/client-web build`

Expected: PASS and emit `packages/client-web/dist/**`.

Run: `pnpm --filter @realmfall/client-electron build`

Expected: PASS and emit `packages/client-electron/dist/**`.

Run: `pnpm --filter @realmfall/client-electron start`

Expected: Electron opens one desktop window, the game bootstraps, and the version widget loads without `version.json` network failures.

- [ ] **Step 5: Commit the runtime**

```bash
git add \
  packages/client-electron/src/mainProcess.ts \
  packages/client-electron/src/main.ts \
  packages/client-electron/src/dev.ts \
  packages/client-electron/src/preload.ts \
  packages/client-electron/src/__tests__/mainProcess.spec.test.ts
git commit -m "feat: boot realmfall inside electron shell"
```

## Task 5: Update Docs And Canonical Specs

**Files:**

- Modify: `README.md`
- Modify: `packages/client-electron/README.md`
- Modify: `packages/client-web/README.md`
- Modify: `docs/specs/reference/technical-solutions/README.md`
- Create: `docs/specs/reference/technical-solutions/desktop-client-shell/spec.md`
- Modify: `docs/specs/reference/technical-solutions/application-architecture/spec.md`
- Modify: `docs/specs/reference/technical-solutions/version-checking/spec.md`

- [ ] **Step 1: Write the documentation updates**

```md
<!-- README.md -->

- `pnpm dev:electron`
- `pnpm build:electron`
- `pnpm start:electron`

- [`packages/client-electron`](./packages/client-electron/README.md): thin Electron shell that hosts the existing web client over a local desktop runtime.
```

```md
<!-- packages/client-electron/README.md -->

# Realmfall Electron Client

`@realmfall/client-electron` is the thin desktop shell for Realmfall. It owns the Electron main process, preload boundary, and localhost serving path for the built `@realmfall/client-web` bundle. The renderer UI and gameplay runtime remain in `@realmfall/client-web` and `@realmfall/core`.

## Local Commands

- `pnpm --filter @realmfall/client-electron dev`
- `pnpm --filter @realmfall/client-electron build`
- `pnpm --filter @realmfall/client-electron start`
- `pnpm --filter @realmfall/client-electron typecheck`
- `pnpm --filter @realmfall/client-electron lint`
- `pnpm --filter @realmfall/client-electron test`

## Notes

- Phase one is intentionally “client-web as-is”.
- Future local save files and Steam Cloud sync are planned follow-on work, not part of the initial shell.
```

```md
<!-- docs/specs/reference/technical-solutions/desktop-client-shell/spec.md -->

# Desktop Client Shell

## Scope

This spec covers the shipped Electron desktop shell that hosts the existing web client.

## Current Solution

- `packages/client-electron/src/main.ts` is the production Electron entrypoint.
- `packages/client-electron/src/dev.ts` targets the existing `client-web` dev server instead of forking the renderer.
- `packages/client-electron/src/staticServer.ts` serves the built `packages/client-web/dist` bundle on localhost so the renderer keeps its HTTP-origin assumptions for locale assets and `version.json`.
- `packages/client-electron/src/preload.ts` exposes a minimal isolated bridge and does not enable renderer Node integration.
- The Electron package does not yet implement filesystem-backed saves or Steam Cloud sync.

## Main Implementation Areas

- `packages/client-electron/src/main.ts`
- `packages/client-electron/src/dev.ts`
- `packages/client-electron/src/mainProcess.ts`
- `packages/client-electron/src/window.ts`
- `packages/client-electron/src/staticServer.ts`
- `packages/client-electron/src/preload.ts`
```

- [ ] **Step 2: Review the docs diff for correctness and plan wording**

Run: `git diff -- README.md packages/client-electron/README.md packages/client-web/README.md docs/specs/reference/technical-solutions/README.md docs/specs/reference/technical-solutions/desktop-client-shell/spec.md docs/specs/reference/technical-solutions/application-architecture/spec.md docs/specs/reference/technical-solutions/version-checking/spec.md`

Expected: The diff describes the current shipped Electron shell directly, mentions future local saves and Steam Cloud only as planned follow-on work, and does not introduce stale “TODO” wording.

- [ ] **Step 3: Run the package and workspace verification commands**

Run: `pnpm --filter @realmfall/client-electron typecheck`

Expected: PASS

Run: `pnpm --filter @realmfall/client-electron lint`

Expected: PASS

Run: `pnpm --filter @realmfall/client-electron test`

Expected: PASS

Run: `pnpm build`

Expected: PASS with the new Electron package included automatically through the workspace package graph.

- [ ] **Step 4: Commit the docs and spec updates**

```bash
git add \
  README.md \
  packages/client-electron/README.md \
  packages/client-web/README.md \
  docs/specs/reference/technical-solutions/README.md \
  docs/specs/reference/technical-solutions/desktop-client-shell/spec.md \
  docs/specs/reference/technical-solutions/application-architecture/spec.md \
  docs/specs/reference/technical-solutions/version-checking/spec.md
git commit -m "docs: describe electron desktop shell"
```

- [ ] **Step 5: Final manual smoke pass**

Run: `pnpm dev:electron`

Expected: Electron opens against the live `client-web` dev server, gameplay boots, UI interactions match the browser client, and no Electron-specific renderer imports are needed in `packages/client-web/src/**`.

## Self-Review

### Spec coverage

- Electron thin shell package: covered by Tasks 1 through 4.
- Reuse `client-web` as-is: covered by Tasks 2 through 4 and the localhost-server design.
- Keep filesystem saves and Steam Cloud out of phase one while documenting them as future work: covered by Task 5.
- React Native deferral: intentionally left out of this plan and called out in the scope section as a separate future plan.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain in steps.
- Commands are explicit.
- New file paths are explicit.
- Commit messages are explicit.

### Type consistency

- `resolveRuntimeConfig`, `startStaticServer`, `buildWindowOptions`, and `createMainProcessController` are used consistently across the tasks.
- The static-server production URL and the runtime-config production URL both use port `43110`.

## Execution Handoff

Plan complete and saved to `docs/implementation-notes/improvements/2026-05-12-electron-client-shell/plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
