import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED_CLIENT_BRIDGE_FILES = new Set([
  'src/i18n/labels.ts',
  'src/i18n/index.ts',
  'src/components/storybook/storybookHelpers.tsx',
]);

export function collectSourceFiles(root: string, files: string[] = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);

    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, files);
      continue;
    }

    if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.test\.(ts|tsx)$/.test(entry.name) &&
      !/\.stories\.tsx$/.test(entry.name) &&
      isEnforcedBoundaryFile(fullPath)
    ) {
      files.push(fullPath.split('\\').join('/'));
    }
  }

  return files;
}

export function getClientImportSpecifiers(filePath: string) {
  const source = readFileSync(filePath, 'utf8');
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)];

  return imports
    .map((match) => match[1] ?? '')
    .filter((specifier) => specifier.includes('/client/src'))
    .filter((specifier) => !isAssetSpecifier(specifier));
}

function isAssetSpecifier(specifier: string) {
  return /\.(?:svg|png|jpg|jpeg|webp|gif|avif|mp3|wav|ogg|json|css|scss|sass|less)(?:\?.*)?$/.test(
    specifier,
  );
}

function isEnforcedBoundaryFile(filePath: string) {
  const normalized = filePath.split('\\').join('/');
  return (
    !ALLOWED_CLIENT_BRIDGE_FILES.has(normalized) &&
    !normalized.endsWith('.test.ts') &&
    !normalized.endsWith('.test.tsx') &&
    !normalized.endsWith('.stories.tsx')
  );
}
