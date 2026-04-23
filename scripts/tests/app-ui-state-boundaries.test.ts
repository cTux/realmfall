import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function collectSourceFiles(root: string, files: string[] = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);
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

function getBroadStateImports(filePath: string) {
  const source = readFileSync(filePath, 'utf8');
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)];
  return imports
    .map((match) => match[1] ?? '')
    .filter((specifier) => specifier.endsWith('/game/state'));
}

const ALLOWED_BROAD_STATE_IMPORT_FILES = new Set([
  'src/app/App/hooks/useAppWorldClock.ts',
  'src/app/App/world/pixiWorldInteractions.ts',
]);

describe('app and ui game-state boundaries', () => {
  it('keeps broad game/state imports out of non-test app and ui modules', () => {
    const sourceFiles = [
      ...collectSourceFiles('src/app'),
      ...collectSourceFiles('src/ui'),
    ];

    const violations = sourceFiles.flatMap((filePath) =>
      getBroadStateImports(filePath)
        .filter(() => !ALLOWED_BROAD_STATE_IMPORT_FILES.has(filePath))
        .map((specifier) => ({
          filePath,
          specifier,
        })),
    );

    expect(violations).toEqual([]);
  });
});
