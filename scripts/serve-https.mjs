import { createRequire } from 'node:module';
import { ensureLocalhostHttpsCertificate } from './localhost-https.mjs';
import { spawnManagedChild } from './managed-child-process.mjs';

const require = createRequire(import.meta.url);
const serveBinPath = require.resolve('serve/build/main.js');
const { certPath, keyPath } = await ensureLocalhostHttpsCertificate();
const forwardedArgs = process.argv.slice(2);

const child = spawnManagedChild(
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
    ...forwardedArgs,
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
