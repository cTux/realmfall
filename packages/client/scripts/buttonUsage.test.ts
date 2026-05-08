import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectTsxFiles,
  isTestFile,
  sourceRoot,
} from './buttonUsageTestkit';
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
