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
      files.push(fullPath.split('\\').join('/'));
    }
  }

  return files;
}

function getClientImportSpecifiers(filePath: string) {
  const source = readFileSync(filePath, 'utf8');
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)];

  return imports
    .map((match) => match[1] ?? '')
    .filter((specifier) => specifier.includes('/client/src'));
}

describe('ui game package boundaries', () => {
  it('keeps packages/ui/src/game free of packages/client/src imports', () => {
    const sourceFiles = collectSourceFiles('src/game');

    const violations = sourceFiles.flatMap((filePath) =>
      getClientImportSpecifiers(filePath).map((specifier) => ({
        filePath,
        specifier,
      })),
    );

    expect(violations).toEqual([]);
  });
});
