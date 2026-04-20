import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

function reserveRandomPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Failed to resolve a random dev-server port.'));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

const port = await reserveRandomPort();
const pnpmCommand =
  process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'pnpm';
const forwardedArgs = process.argv.slice(2);

console.log(`Starting pnpm dev on random port ${port}.`);

const pnpmArgs =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', 'pnpm.cmd', 'dev', '--port', String(port)]
    : ['dev', '--port', String(port)];
const child = spawn(pnpmCommand, [...pnpmArgs, ...forwardedArgs], {
  env: process.env,
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error('Failed to start pnpm dev.', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
