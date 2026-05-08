import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface PackageManifest {
  name: string;
  scripts?: Record<string, string>;
}

interface MissingSharedTestScript {
  packageName: string;
  testScripts: string[];
}

const repoRoot = resolve(process.cwd(), '..', '..');
const packagesRoot = resolve(repoRoot, 'packages');

function readPackageManifest(packagePath: string): PackageManifest {
  return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageManifest;
}

function getWorkspacePackageManifestPaths() {
  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesRoot, entry.name, 'package.json'));
}

export function collectMissingSharedTestScripts(): MissingSharedTestScript[] {
  return getWorkspacePackageManifestPaths().flatMap((packagePath) => {
    const manifest = readPackageManifest(packagePath);
    const scripts = manifest.scripts ?? {};
    const testScripts = Object.keys(scripts).filter((name) =>
      name.startsWith('test:'),
    );

    if (testScripts.length === 0 || typeof scripts.test === 'string') {
      return [];
    }

    return [
      {
        packageName: manifest.name,
        testScripts,
      },
    ];
  });
}
