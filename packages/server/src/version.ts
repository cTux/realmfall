import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const rootPackageJsonUrl = new URL('../../../package.json', import.meta.url);

export function createBuildVersion(
  packageVersion: string,
  revision: string | null,
) {
  return revision ? `${packageVersion}+${revision}` : packageVersion;
}

export function getHeadRevision(cwd = process.cwd()) {
  try {
    const result = spawnSync(gitBin, ['rev-parse', '--short=12', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.status !== 0) {
      return null;
    }

    const revision = result.stdout.trim();
    return revision.length > 0 ? revision : null;
  } catch {
    return null;
  }
}

export function getReleaseVersion() {
  const packageJson = JSON.parse(readFileSync(rootPackageJsonUrl, 'utf8')) as {
    version?: unknown;
  };

  if (typeof packageJson.version !== 'string') {
    throw new Error('Expected root package.json to contain a string version.');
  }

  return packageJson.version;
}

export function getGameVersion(cwd = process.cwd()) {
  return createBuildVersion(getReleaseVersion(), getHeadRevision(cwd));
}
