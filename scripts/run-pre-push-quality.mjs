import { spawnSync } from 'node:child_process';
import { createPnpmInvocation } from './pnpm-command.mjs';
import { PRE_PUSH_COMMANDS } from './run-pre-push-quality.helpers.mjs';

function logStep(message) {
  console.log(`\n> ${message}`);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const scriptName of PRE_PUSH_COMMANDS) {
  logStep(`Running pnpm ${scriptName} for pre-push quality`);
  const pnpm = createPnpmInvocation([scriptName]);
  run(pnpm.command, pnpm.args);
}
