import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = resolve(process.cwd(), 'src');
const rawButtonPattern = /<button(?:\s|>)/;

describe('client button usage', () => {
  it('uses shared Button components in runtime and storybook TSX files', () => {
    const offendingFiles = collectTsxFiles(sourceRoot)
      .filter((filePath) => !isTestFile(filePath))
      .filter((filePath) =>
        rawButtonPattern.test(readFileSync(filePath, 'utf8')),
      )
      .map((filePath) =>
        relative(process.cwd(), filePath).replaceAll('\\', '/'),
      );

    expect(offendingFiles).toEqual([]);
  });
});

function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectTsxFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith('.tsx') ? [fullPath] : [];
  });
}

function isTestFile(filePath: string) {
  return filePath.endsWith('.test.tsx') || filePath.endsWith('.test.ts');
}
