import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const CLIENT_SRC_ROOT = fileURLToPath(
  new URL('../../packages/client/src', import.meta.url),
);
const CLIENT_GAME_ROOT = fileURLToPath(
  new URL('../../packages/client/src/game', import.meta.url),
);

function collectSourceFiles(root: string, files: string[] = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);
    if (fullPath === CLIENT_GAME_ROOT) {
      continue;
    }

    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, files);
      continue;
    }

    if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.test\.(ts|tsx)$/.test(entry.name) &&
      !/\.stories\.tsx$/.test(entry.name)
    ) {
      files.push(fullPath.replaceAll('\\', '/'));
    }
  }

  return files;
}

function resolveClientImport(filePath: string, specifier: string) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const base = resolve(dirname(filePath), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function getClientGameImports(filePath: string) {
  const source = readFileSync(filePath, 'utf8');
  const imports = [
    ...source.matchAll(/from\s+['"]([^'"]+)['"]/g),
    ...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g),
  ];

  return imports
    .map((match) => match[1] ?? '')
    .filter((specifier) => {
      const resolved = resolveClientImport(filePath, specifier);
      if (!resolved) {
        return false;
      }

      const relativePath = relative(CLIENT_GAME_ROOT, resolved).replaceAll(
        '\\',
        '/',
      );

      return relativePath !== '..' && !relativePath.startsWith('../');
    });
}

describe('client gameplay boundaries', () => {
  it('keeps non-game client modules off local gameplay runtime imports', () => {
    const sourceFiles = collectSourceFiles(CLIENT_SRC_ROOT);

    const violations = sourceFiles.flatMap((filePath) =>
      getClientGameImports(filePath).map((specifier) => ({
        filePath,
        specifier,
      })),
    );

    expect(violations).toEqual([]);
  });
});
