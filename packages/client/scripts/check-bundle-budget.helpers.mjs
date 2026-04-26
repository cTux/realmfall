import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

export const DIST_DIR = join(process.cwd(), 'dist');
export const DIST_ASSETS_DIR = join(DIST_DIR, 'assets');
export const DIST_JS_DIR = join(DIST_DIR, 'assets', 'js');
export const MANIFEST_PATH = join(DIST_DIR, '.vite', 'manifest.json');

export const CHUNK_BUDGETS = {
  index: 6_000,
  App: 92_000,
  'background-audio': 54_420,
  'react-core': 8_689,
  'react-dom-vendor': 199_966,
  state: 532_132,
  en: 122_000,
  pixi: 549_560,
};

export const MERGED_CHUNK_BUDGET_COVERAGE = {};

export const STARTUP_TOTAL_BUDGET = 1_510_000;
export const BUDGET_NEAR_CAP_RATIO = 0.9;

export function formatKiB(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatBudgetStatus(name, sizeBytes, budgetBytes) {
  const remainingBytes = Math.max(0, budgetBytes - sizeBytes);
  const usageRatio = budgetBytes === 0 ? 0 : sizeBytes / budgetBytes;
  const nearCapText = usageRatio >= BUDGET_NEAR_CAP_RATIO ? ', near cap' : '';

  return `${name}: ${formatKiB(sizeBytes)} within ${formatKiB(
    budgetBytes,
  )} (${formatKiB(remainingBytes)} headroom, ${formatPercent(
    usageRatio,
  )} used${nearCapText})`;
}

export function isStrictBundleBudgetMode(
  args = process.argv.slice(2),
  env = process.env,
) {
  return (
    args.includes('--strict') || env.REALMFALL_BUNDLE_BUDGET_STRICT === '1'
  );
}

export function getBundleBudgetExitCode(failures, strictMode) {
  return strictMode && failures.length > 0 ? 1 : 0;
}

export function getBuiltChunks(distAssetsDir = DIST_ASSETS_DIR) {
  const chunks = [];

  function visit(directory) {
    for (const fileName of readdirSync(directory)) {
      const filePath = join(directory, fileName);
      const stats = statSync(filePath);
      if (stats.isDirectory()) {
        visit(filePath);
        continue;
      }

      const extension = extname(fileName);
      if (extension !== '.js' && extension !== '.json') {
        continue;
      }

      chunks.push({
        fileName: relative(distAssetsDir, filePath).replaceAll('\\', '/'),
        size: stats.size,
      });
    }
  }

  visit(distAssetsDir);

  return chunks;
}

export function loadManifest(manifestPath = MANIFEST_PATH) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function findEntryKey(manifest, filePathSuffix) {
  return Object.keys(manifest).find((key) =>
    key.replace(/\\/g, '/').endsWith(filePathSuffix.replace(/\\/g, '/')),
  );
}

export function getStartupChunkFiles(manifest, entryKey) {
  const startupFiles = new Set();
  const staticVisited = new Set();

  function visitStatic(key) {
    if (staticVisited.has(key)) {
      return;
    }

    staticVisited.add(key);
    const entry = manifest[key];
    if (!entry) {
      return;
    }

    if (
      (entry.file?.endsWith('.js') || entry.file?.endsWith('.json')) &&
      !isLazyDomainChunkFile(entry.file)
    ) {
      startupFiles.add(
        relative(DIST_DIR, join(DIST_DIR, entry.file)).replaceAll('\\', '/'),
      );
    }

    for (const importedKey of entry.imports ?? []) {
      visitStatic(importedKey);
    }
  }

  visitStatic(entryKey);

  const entry = manifest[entryKey];
  for (const dynamicKey of entry?.dynamicImports ?? []) {
    visitStatic(dynamicKey);
  }

  return startupFiles;
}

function isLazyDomainChunkFile(fileName) {
  const baseFileName = basename(fileName);

  return (
    baseFileName.startsWith('background-audio-') ||
    baseFileName.startsWith('pixi-')
  );
}

export function getChunkByPrefix(chunks, prefix) {
  return chunks.find((chunk) =>
    basename(chunk.fileName).startsWith(`${prefix}-`),
  );
}

export function getChunkBudgetTarget(chunks, prefix) {
  const directChunk = getChunkByPrefix(chunks, prefix);
  if (directChunk) {
    return {
      kind: 'direct',
      chunk: directChunk,
    };
  }

  const mergedInto = MERGED_CHUNK_BUDGET_COVERAGE[prefix];
  if (!mergedInto) {
    return null;
  }

  const mergedChunk = getChunkByPrefix(chunks, mergedInto);
  if (!mergedChunk) {
    return null;
  }

  return {
    kind: 'merged',
    chunk: mergedChunk,
    mergedInto,
  };
}
