import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const packageRoot = resolve(import.meta.dirname, '..');
const releaseRoot = resolve(packageRoot, 'release');
const releaseDir = resolve(
  releaseRoot,
  `win-${new Date().toISOString().replaceAll(':', '-').replace('.', '-')}`,
);

await mkdir(releaseDir, { recursive: true });

await runPnpm(['run', 'build:app']);
await runPnpm(
  [
    'exec',
    'electron-builder',
    '--config',
    './electron-builder.config.mjs',
    '--win',
    'nsis',
  ],
  {
    REALMFALL_ELECTRON_RELEASE_DIR: releaseDir,
  },
);

function runPnpm(args, extraEnv = {}) {
  const pnpmEntrypoint = process.env.npm_execpath;

  if (!pnpmEntrypoint) {
    throw new Error('pnpm entrypoint is unavailable in npm_execpath.');
  }

  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [pnpmEntrypoint, ...args], {
      cwd: packageRoot,
      env: {
        ...process.env,
        ...extraEnv,
      },
      stdio: 'inherit',
    });

    child.once('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`pnpm ${args.join(' ')} exited with code ${code}.`));
    });

    child.once('error', reject);
  });
}
