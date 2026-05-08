import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const componentsDir = resolve(process.cwd(), 'src/ui/components');

function hasStoryFile(directory: string): boolean {
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return hasStoryFile(fullPath);
    }

    return entry.isFile() && entry.name.endsWith('.stories.tsx');
  });
}

export function hasComponentStoryCoverage(componentDirectoryName: string) {
  return hasStoryFile(join(componentsDir, componentDirectoryName));
}

export function isStandaloneComponentFile(name: string) {
  return (
    !name.endsWith('.stories.tsx') &&
    !name.endsWith('.test.tsx') &&
    /^[A-Z]/.test(name)
  );
}
