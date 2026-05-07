import { createRequire } from 'node:module';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { ensureLocalhostHttpsCertificate } from './localhost-https.mjs';
import { spawnManagedChild } from './managed-child-process.mjs';

export function createServeHttpsInvocation({
  certPath,
  forwardedArgs = [],
  keyPath,
  scriptUrl = import.meta.url,
}) {
  const require = createRequire(scriptUrl);
  const distPath = fileURLToPath(new URL('../dist', scriptUrl));
  const serveConfigPath = fileURLToPath(new URL('../serve.json', scriptUrl));

  return {
    args: [
      require.resolve('serve/build/main.js'),
      distPath,
      '--config',
      serveConfigPath,
      '--listen',
      '5173',
      '--ssl-cert',
      certPath,
      '--ssl-key',
      keyPath,
      ...forwardedArgs,
    ],
    command: process.execPath,
  };
}

const { certPath, keyPath } = await ensureLocalhostHttpsCertificate();
const invocation = createServeHttpsInvocation({
  certPath,
  forwardedArgs: process.argv.slice(2),
  keyPath,
});

const child = spawnManagedChild(invocation.command, invocation.args, {
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
