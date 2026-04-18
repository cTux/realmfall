import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { ensureLocalhostHttpsCertificate } from './localhost-https.mjs';

const require = createRequire(import.meta.url);
const serveBinPath = require.resolve('serve/build/main.js');
const { certPath, keyPath } = await ensureLocalhostHttpsCertificate();

const child = spawn(
  process.execPath,
  [
    serveBinPath,
    'dist',
    '--config',
    '../serve.json',
    '--ssl-cert',
    certPath,
    '--ssl-key',
    keyPath,
  ],
  {
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
