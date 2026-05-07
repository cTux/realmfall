import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServeHttpsInvocation } from './serve-https.mjs';

const require = createRequire(import.meta.url);
const packageRoot = fileURLToPath(new URL('..', import.meta.url));

describe('client secure serve invocation', () => {
  it('serves the built client from explicit localhost HTTPS paths on port 5173', () => {
    const invocation = createServeHttpsInvocation({
      certPath: '/tmp/realmfall-cert.pem',
      forwardedArgs: ['--no-clipboard'],
      keyPath: '/tmp/realmfall-key.pem',
    });

    expect(invocation.command).toBe(process.execPath);
    expect(invocation.args).toEqual([
      require.resolve('serve/build/main.js'),
      resolve(packageRoot, 'dist'),
      '--config',
      resolve(packageRoot, 'serve.json'),
      '--listen',
      '5173',
      '--ssl-cert',
      '/tmp/realmfall-cert.pem',
      '--ssl-key',
      '/tmp/realmfall-key.pem',
      '--no-clipboard',
    ]);
  });
});
