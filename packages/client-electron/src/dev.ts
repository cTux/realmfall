import { spawn } from 'node:child_process';
import process from 'node:process';

type Invocation = {
  args: string[];
  command: string;
};

function createPnpmInvocation(args: string[]): Invocation {
  if (
    typeof process.env.npm_execpath === 'string' &&
    process.env.npm_execpath
  ) {
    return {
      args: [process.env.npm_execpath, ...args],
      command: process.execPath,
    };
  }

  return {
    args,
    command: 'pnpm',
  };
}

function spawnManagedInvocation(invocation: Invocation, env = process.env) {
  return spawn(invocation.command, invocation.args, {
    env,
    shell: false,
    stdio: 'inherit',
  });
}

async function runInvocation(invocation: Invocation, env = process.env) {
  await new Promise<void>((resolve, reject) => {
    const child = spawnManagedInvocation(invocation, env);

    child.once('error', reject);
    child.once('exit', (code) => {
      if ((code ?? 1) !== 0) {
        reject(
          new Error(`${invocation.command} exited with code ${code ?? 1}`),
        );
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
      // Keep polling until the dev server is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

await runInvocation(
  createPnpmInvocation(['--filter', '@realmfall/client-electron', 'build']),
);

const rendererUrl =
  process.env.REALMFALL_ELECTRON_RENDERER_URL ?? 'https://localhost:5173';

const clientWeb = spawnManagedInvocation(
  createPnpmInvocation(['--filter', '@realmfall/client-web', 'dev']),
);

await waitForUrl(`${rendererUrl}/version.json`);

const electron = spawnManagedInvocation(
  createPnpmInvocation(['exec', 'electron', './dist/main.js']),
  {
    ...process.env,
    REALMFALL_ELECTRON_APP_MODE: 'development',
    REALMFALL_ELECTRON_RENDERER_URL: rendererUrl,
  },
);

electron.once('exit', (code) => {
  clientWeb.kill();
  process.exit(code ?? 0);
});
