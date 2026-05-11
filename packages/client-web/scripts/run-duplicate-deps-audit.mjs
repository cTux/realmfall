import { spawnManagedChild } from './managed-child-process.mjs';
import { createPnpmInvocation } from './pnpm-command.mjs';

const environment = {
  ...process.env,
  REALMFALL_DUPLICATE_DEPS_AUDIT: '1',
};
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
