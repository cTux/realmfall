import {
  CHUNK_BUDGETS,
  DIST_DIR,
  DIST_JS_DIR,
  STARTUP_TOTAL_BUDGET,
  findEntryKey,
  formatKiB,
  getBuiltChunks,
  getChunkBudgetTarget,
  getStartupChunkFiles,
  loadManifest,
} from './check-bundle-budget.helpers.mjs';

const chunks = getBuiltChunks();
const manifest = loadManifest();
const failures = [];

for (const [chunkName, budgetBytes] of Object.entries(CHUNK_BUDGETS)) {
  const budgetTarget = getChunkBudgetTarget(chunks, chunkName);

  if (!budgetTarget) {
    failures.push(
      `Missing expected chunk "${chunkName}" in ${DIST_JS_DIR.replaceAll(
        '\\',
        '/',
      )}.`,
    );
    continue;
  }

  if (budgetTarget.kind === 'merged') {
    console.log(
      `${chunkName}: merged into ${budgetTarget.mergedInto} and covered by that chunk budget`,
    );
    continue;
  }

  const { chunk } = budgetTarget;
  if (chunk.size > budgetBytes) {
    failures.push(
      `"${chunk.fileName}" is ${formatKiB(chunk.size)} which exceeds the ${formatKiB(
        budgetBytes,
      )} budget for ${chunkName}.`,
    );
    continue;
  }

  console.log(
    `${chunkName}: ${formatKiB(chunk.size)} within ${formatKiB(budgetBytes)}`,
  );
}

const mainEntryKey =
  findEntryKey(manifest, 'src/main.tsx') ??
  findEntryKey(manifest, 'index.html');
if (!mainEntryKey) {
  failures.push(
    `Missing startup entry in ${DIST_DIR.replaceAll('\\', '/')}/.vite/manifest.json.`,
  );
} else {
  const startupChunkFiles = getStartupChunkFiles(manifest, mainEntryKey);
  const startupChunks = chunks.filter((chunk) =>
    startupChunkFiles.has(`assets/js/${chunk.fileName}`),
  );
  const startupTotal = startupChunks.reduce(
    (sum, chunk) => sum + chunk.size,
    0,
  );

  if (startupTotal > STARTUP_TOTAL_BUDGET) {
    failures.push(
      `Startup JS totals ${formatKiB(startupTotal)} which exceeds the ${formatKiB(
        STARTUP_TOTAL_BUDGET,
      )} budget.`,
    );
  } else {
    console.log(
      `startup-total: ${formatKiB(startupTotal)} within ${formatKiB(STARTUP_TOTAL_BUDGET)}`,
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
