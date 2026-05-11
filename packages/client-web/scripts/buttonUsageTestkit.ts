import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const sourceRoot = resolve(process.cwd(), 'src');

export function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectTsxFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith('.tsx') ? [fullPath] : [];
  });
}

export function isTestFile(filePath: string) {
  return filePath.endsWith('.test.tsx') || filePath.endsWith('.test.ts');
}
