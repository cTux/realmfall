const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const VERSION_LINE_PATTERN = /^(?<indent>\s*)"version":\s*"[^"]+",\s*$/mu;

export function parseVersion(version) {
  const match = SEMVER_PATTERN.exec(version);

  if (!match) {
    throw new Error(`Unsupported semver version: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function getCommitVersion(currentVersion, headVersion) {
  if (headVersion == null) {
    return currentVersion;
  }

  const current = parseVersion(currentVersion);
  const head = parseVersion(headVersion);

  if (current.major !== head.major || current.minor !== head.minor) {
    throw new Error(
      `Expected package.json to keep the same major/minor while bumping the patch version (${headVersion} -> ${currentVersion}).`,
    );
  }

  if (current.patch > head.patch) {
    return currentVersion;
  }

  return `${head.major}.${head.minor}.${head.patch + 1}`;
}

export function replacePackageVersion(text, nextVersion) {
  if (!VERSION_LINE_PATTERN.test(text)) {
    throw new Error('Unable to locate the package.json version line.');
  }

  return text.replace(
    VERSION_LINE_PATTERN,
    (_, indent = '  ') => `${indent}"version": "${nextVersion}",`,
  );
}
