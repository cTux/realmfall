import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { build, mergeConfig } from 'vite';
import viteConfig from '../vite.config';

function collectFiles(root: string, files: string[] = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);

    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

const tempDirs: string[] = [];

afterEach(() => {
  tempDirs.splice(0).forEach((directory) => {
    rmSync(directory, { force: true, recursive: true });
  });
});

describe('production icon paths', () => {
  it('does not emit source-tree icon URLs into the production client bundle', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'realmfall-client-icons-'));
    tempDirs.push(outDir);

    await build(
      mergeConfig(viteConfig, {
        build: {
          outDir,
        },
        logLevel: 'silent',
      }),
    );

    const bundleText = collectFiles(join(outDir, 'assets', 'js'))
      .filter((filePath) => filePath.endsWith('.js'))
      .map((filePath) => readFileSync(filePath, 'utf8'))
      .join('\n');

    expect(bundleText).not.toContain('client/src/assets/icons');
    expect(bundleText).not.toContain('client/src/assets/game-icons');
    expect(bundleText).not.toContain('/src/assets/icons/generated/');
    expect(bundleText).not.toContain('/src/game-icons/');
  }, 120_000);
});
