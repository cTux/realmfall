import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Violation {
  file: string;
  lineNumber: number;
  line: string;
}

const PERFORMANCE_HARNESS_IMPORT_RE =
  /import\s*(?:\([^)]*\)|[\w\s{},*]*from\s+['"])[^'"]*performance\/performanceHarness['"]/;
const thisDir = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(thisDir, '..', 'src');

function collectSourceFiles(directory: string) {
  const files = readdirSync(directory, { withFileTypes: true });
  const imported: string[] = [];

  for (const file of files) {
    const filePath = resolve(directory, file.name);
    if (file.isDirectory()) {
      imported.push(...collectSourceFiles(filePath));
      continue;
    }

    if (extname(file.name) === '.ts' || extname(file.name) === '.tsx') {
      imported.push(filePath);
    }
  }

  return imported;
}

function isIgnoredFile(filePath: string) {
  const fileName = filePath.split(/[\\/]/).at(-1) ?? '';
  if (fileName === 'main.tsx') {
    return true;
  }

  return (
    fileName.endsWith('.test.ts') ||
    fileName.endsWith('.test.tsx') ||
    fileName.endsWith('testkit.ts') ||
    fileName.endsWith('testkit.tsx') ||
    fileName === 'performanceHarness.ts' ||
    fileName === 'performanceHarnessTestkit.ts' ||
    fileName.endsWith('.d.ts')
  );
}

function findForbiddenImports(): Violation[] {
  return collectSourceFiles(srcRoot).flatMap((filePath) => {
    if (isIgnoredFile(filePath)) {
      return [];
    }

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    const file = relative(srcRoot, filePath).replace(/\\/g, '/');

    return lines
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter(({ line }) => PERFORMANCE_HARNESS_IMPORT_RE.test(line))
      .map(({ line, lineNumber }) => ({
        file,
        lineNumber,
        line: line.trim(),
      }));
  });
}

describe('performanceHarness import policy', () => {
  it('allows only main.tsx to import performanceHarness directly', () => {
    expect(findForbiddenImports()).toEqual([]);
  });
});
