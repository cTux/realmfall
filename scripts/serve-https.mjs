import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import selfsigned from 'selfsigned';

const require = createRequire(import.meta.url);
const certDir = join(tmpdir(), 'realmfall-https');
const certPath = join(certDir, 'localhost-cert.pem');
const keyPath = join(certDir, 'localhost-key.pem');
const serveBinPath = require.resolve('serve/build/main.js');

mkdirSync(certDir, { recursive: true });

const { cert, private: privateKey } = await selfsigned.generate(
  [{ name: 'commonName', value: 'localhost' }],
  {
    algorithm: 'sha256',
    days: 30,
    keySize: 2048,
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
          { type: 7, ip: '::1' },
        ],
      },
    ],
  },
);

writeFileSync(certPath, cert);
writeFileSync(keyPath, privateKey);

const child = spawn(
  process.execPath,
  [
    serveBinPath,
    'dist',
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
