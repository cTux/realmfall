import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'cmd.exe' : 'pnpm';
const args =
  process.platform === 'win32' ? ['/d', '/s', '/c', 'pnpm build'] : ['build'];

const child = spawn(command, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    REALMFALL_DUPLICATE_DEPS_AUDIT: '1',
  },
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
