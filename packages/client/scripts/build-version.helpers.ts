import { spawnSync } from 'node:child_process';
import process from 'node:process';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';

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

export function getAppBuildVersion(
  packageVersion: string,
  cwd = process.cwd(),
) {
  return createBuildVersion(packageVersion, getHeadRevision(cwd));
}
