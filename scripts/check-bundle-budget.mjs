/* global console, process */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_JS_DIR = join(process.cwd(), 'dist', 'assets', 'js');

const BUDGETS = {
  index: 240_000,
  'react-vendor': 150_000,
  pixi: 440_000,
};

function formatKiB(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

function getBuiltChunks() {
  return readdirSync(DIST_JS_DIR)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => ({
      fileName,
      size: statSync(join(DIST_JS_DIR, fileName)).size,
    }));
}

function getBudgetChunk(chunks, chunkName) {
  return chunks.find((chunk) => chunk.fileName.startsWith(`${chunkName}-`));
}

const chunks = getBuiltChunks();
const failures = [];

for (const [chunkName, budgetBytes] of Object.entries(BUDGETS)) {
  const chunk = getBudgetChunk(chunks, chunkName);

  if (!chunk) {
    failures.push(
      `Missing expected chunk "${chunkName}" in ${DIST_JS_DIR.replaceAll(
        '\\',
        '/',
      )}.`,
    );
    continue;
  }

  if (chunk.size > budgetBytes) {
    failures.push(
      `"${chunk.fileName}" is ${formatKiB(chunk.size)} which exceeds the ${formatKiB(
        budgetBytes,
      )} budget for ${chunkName}.`,
    );
  } else {
    console.log(
      `${chunkName}: ${formatKiB(chunk.size)} within ${formatKiB(budgetBytes)}`,
    );
  }
}

if (failures.length > 0) {
  console.error('Bundle budget check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Bundle budget check passed.');
