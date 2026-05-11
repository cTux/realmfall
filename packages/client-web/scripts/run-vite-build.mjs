import { spawnManagedChild } from './managed-child-process.mjs';
import { createPnpmInvocation } from './pnpm-command.mjs';
import { filterKnownPluginTimingWarnings } from './run-vite-build.helpers.mjs';

const invocation = createPnpmInvocation(['exec', 'vite', 'build']);

const child = spawnManagedChild(invocation.command, invocation.args, {
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

const stdoutChunks = [];
const stderrChunks = [];

child.stdout.on('data', (chunk) => {
  stdoutChunks.push(Buffer.from(chunk));
});

child.stderr.on('data', (chunk) => {
  stderrChunks.push(Buffer.from(chunk));
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  process.stdout.write(
    filterKnownPluginTimingWarnings(
      Buffer.concat(stdoutChunks).toString('utf8'),
    ),
  );
  process.stderr.write(
    filterKnownPluginTimingWarnings(
      Buffer.concat(stderrChunks).toString('utf8'),
    ),
  );

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
