import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';

function getNpmExecPath(environment = process.env) {
  const candidate = environment.npm_execpath;

  return typeof candidate === 'string' && candidate.length > 0
    ? candidate
    : null;
}

export function createPnpmInvocation(args, environment = process.env) {
  const npmExecPath = getNpmExecPath(environment);

  if (npmExecPath) {
    return {
      args: [npmExecPath, ...args],
      command: process.execPath,
    };
  }

  if (process.platform === 'win32') {
    const bundledPnpmEntrypoint = join(
      dirname(process.execPath),
      'node_modules',
      'pnpm',
      'bin',
      'pnpm.cjs',
    );

    if (!existsSync(bundledPnpmEntrypoint)) {
      throw new Error(
        'Unable to resolve the pnpm entrypoint on Windows. Install pnpm alongside node or run this script through pnpm so npm_execpath is available.',
      );
    }

    return {
      args: [bundledPnpmEntrypoint, ...args],
      command: process.execPath,
    };
  }

  return {
    args,
    command: 'pnpm',
  };
}
