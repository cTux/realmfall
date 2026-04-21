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
    throw new Error(
      'Unable to resolve the pnpm entrypoint on Windows. Run this script through pnpm so npm_execpath is available.',
    );
  }

  return {
    args,
    command: 'pnpm',
  };
}
