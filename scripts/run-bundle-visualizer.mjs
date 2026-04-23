import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnManagedChild } from './managed-child-process.mjs';
import { createPnpmInvocation } from './pnpm-command.mjs';

const environment = {
  ...process.env,
  REALMFALL_BUNDLE_VISUALIZER: '1',
};

mkdirSync(join('.tests', 'bundle'), { recursive: true });

const { command, args } = createPnpmInvocation(['build'], environment);

const child = spawnManagedChild(command, args, {
  stdio: 'inherit',
  env: environment,
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
