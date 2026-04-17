import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { URL } from 'node:url';

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

function fail(message) {
  process.stderr.write(`Version check failed: ${message}\n`);
  process.exit(1);
}

function parseVersion(version) {
  const match = SEMVER_PATTERN.exec(version);

  if (!match) {
    fail(`"${version}" is not a supported semver version.`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function runGit(args) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return result;
}

const currentPackageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const currentVersion = parseVersion(currentPackageJson.version);

const headCheck = runGit(['rev-parse', '--verify', 'HEAD']);

if (headCheck.status !== 0) {
  process.exit(0);
}

const headPackage = runGit(['show', 'HEAD:package.json']);

if (headPackage.status !== 0) {
  process.exit(0);
}

const previousPackageJson = JSON.parse(headPackage.stdout);
const previousVersion = parseVersion(previousPackageJson.version);

const patchIncreased =
  currentVersion.major === previousVersion.major &&
  currentVersion.minor === previousVersion.minor &&
  currentVersion.patch > previousVersion.patch;

if (!patchIncreased) {
  fail(
    `package.json version must increase its patch version before commit (HEAD: ${previousPackageJson.version}, current: ${currentPackageJson.version}).`,
  );
}
