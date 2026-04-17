import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const DIST_DIR = join(process.cwd(), 'dist');
export const DIST_JS_DIR = join(DIST_DIR, 'assets', 'js');
export const MANIFEST_PATH = join(DIST_DIR, '.vite', 'manifest.json');

export const CHUNK_BUDGETS = {
  index: 5_000,
  App: 80_000,
  'react-vendor': 150_000,
  state: 480_000,
  en: 100_000,
  pixi: 505_000,
};

export const STARTUP_TOTAL_BUDGET = 1_350_000;

export function formatKiB(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

export function getBuiltChunks(distJsDir = DIST_JS_DIR) {
  return readdirSync(distJsDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => ({
      fileName,
      size: statSync(join(distJsDir, fileName)).size,
    }));
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

    if (entry.file?.endsWith('.js')) {
      startupFiles.add(relative(DIST_DIR, join(DIST_DIR, entry.file)).replaceAll('\\', '/'));
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

export function getChunkByPrefix(chunks, prefix) {
  return chunks.find((chunk) => chunk.fileName.startsWith(`${prefix}-`));
}

