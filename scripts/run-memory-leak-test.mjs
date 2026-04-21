import { mkdirSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPnpmInvocation } from './pnpm-command.mjs';

export const MEMORY_LEAK_PORT = 5173;
export const MEMORY_LEAK_URL = `https://localhost:${MEMORY_LEAK_PORT}`;
export const MEMORY_LEAK_HEALTHCHECK_URL = `${MEMORY_LEAK_URL}/version.json`;
export const MEMORY_LEAK_OUTPUT_PATH = resolve(
  '.tests',
  'memory-leaks',
  'latest.json',
);
export const MEMORY_LEAK_SCENARIO_PATH = resolve(
  'scripts',
  'fuite-dock-toggle-scenario.mjs',
);

function parseCliArgs(argv) {
  const parsedArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      parsedArgs[key] = 'true';
      continue;
    }

    parsedArgs[key] = value;
    index += 1;
  }

  return parsedArgs;
}

export function createFuiteArgs(
  url = MEMORY_LEAK_URL,
  outputPath = MEMORY_LEAK_OUTPUT_PATH,
) {
  return [
    'exec',
    'fuite',
    url,
    '--output',
    outputPath,
    '--scenario',
    MEMORY_LEAK_SCENARIO_PATH,
    '--browser-arg',
    '--ignore-certificate-errors',
    '--browser-arg',
    '--allow-insecure-localhost',
  ];
}

function isServerReady(url) {
  return new Promise((resolveRequest, rejectRequest) => {
    const parsedUrl = new URL(url);
    const request =
      parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest;
    const clientRequest = request(
      parsedUrl,
      {
        method: 'GET',
        rejectUnauthorized: false,
      },
      (response) => {
        response.resume();
        resolveRequest((response.statusCode ?? 500) < 500);
      },
    );

    clientRequest.on('error', rejectRequest);
    clientRequest.setTimeout(3_000, () => {
      clientRequest.destroy(new Error('Request timed out'));
    });
    clientRequest.end();
  });
}

export async function waitForServer(
  url = MEMORY_LEAK_HEALTHCHECK_URL,
  { timeoutMs = 120_000, intervalMs = 1_000 } = {},
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (await isServerReady(url)) {
        return;
      }
    } catch {
      // Retry until the dev server is reachable or the timeout expires.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, intervalMs));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  const memoryLeakUrl = cliArgs.url ?? MEMORY_LEAK_URL;
  const memoryLeakHealthcheckUrl =
    cliArgs['healthcheck-url'] ??
    `${memoryLeakUrl.replace(/\/$/, '')}/version.json`;
  const memoryLeakOutputPath = resolve(
    cliArgs.output ?? MEMORY_LEAK_OUTPUT_PATH,
  );

  mkdirSync(dirname(memoryLeakOutputPath), { recursive: true });
  await waitForServer(memoryLeakHealthcheckUrl);

  const pnpm = createPnpmInvocation(
    createFuiteArgs(memoryLeakUrl, memoryLeakOutputPath),
  );
  const fuite = spawn(pnpm.command, pnpm.args, {
    stdio: 'inherit',
  });

  fuite.on('exit', (code) => {
    process.exit(code ?? 1);
  });
  fuite.on('error', (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
