const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const REMOTE_HEAD_PATTERN =
  /^ref:\s+refs\/heads\/(?<branch>[^\t\r\n]+)\s+HEAD$/mu;
const VERSION_LINE_PATTERN = /^(?<indent>\s*)"version":\s*"[^"]+",\s*$/u;
const VERSION_CONFLICT_PATTERN =
  /<<<<<<<[^\r\n]*\r?\n(?<ours>[^\r\n]*\r?\n)=======\r?\n(?<theirs>[^\r\n]*\r?\n)>>>>>>>[^\r\n]*\r?\n?/gu;

export function parseCliArgs(argv) {
  const options = {
    dryRun: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    throw new Error(`Unsupported argument: ${arg}`);
  }

  return options;
}

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

export function resolveRebasedPackageVersion(
  baseVersion,
  upstreamVersion,
  rebasedVersion,
) {
  const base = parseVersion(baseVersion);
  const upstream = parseVersion(upstreamVersion);
  const rebased = parseVersion(rebasedVersion);

  const versions = [base, upstream, rebased];
  const sameMajorMinor = versions.every(
    (version) => version.major === base.major && version.minor === base.minor,
  );

  if (!sameMajorMinor) {
    throw new Error(
      `Cannot resolve package version conflict across major/minor changes (${baseVersion}, ${upstreamVersion}, ${rebasedVersion}).`,
    );
  }

  const branchIncrements = rebased.patch - base.patch;

  if (branchIncrements < 0) {
    throw new Error(
      `Cannot resolve package version conflict when the rebased patch regresses (${baseVersion} -> ${rebasedVersion}).`,
    );
  }

  return `${upstream.major}.${upstream.minor}.${upstream.patch + branchIncrements}`;
}

export function replacePackageVersionConflict(text, resolvedVersion) {
  const matches = [...text.matchAll(VERSION_CONFLICT_PATTERN)];

  if (matches.length !== 1) {
    throw new Error('Expected exactly one conflict block in package.json.');
  }

  const [match] = matches;
  const oursLine = match.groups?.ours?.replace(/\r?\n$/u, '') ?? '';
  const theirsLine = match.groups?.theirs?.replace(/\r?\n$/u, '') ?? '';
  const oursVersionMatch = VERSION_LINE_PATTERN.exec(oursLine);
  const theirsVersionMatch = VERSION_LINE_PATTERN.exec(theirsLine);

  if (!oursVersionMatch || !theirsVersionMatch) {
    throw new Error(
      'Expected package.json conflict block to contain only version lines.',
    );
  }

  const indent =
    oursVersionMatch.groups?.indent ??
    theirsVersionMatch.groups?.indent ??
    '  ';
  const newline = match[0].includes('\r\n') ? '\r\n' : '\n';
  const replacement = `${indent}"version": "${resolvedVersion}",${newline}`;
  const start = match.index ?? 0;

  return (
    text.slice(0, start) + replacement + text.slice(start + match[0].length)
  );
}

export function parseRemoteDefaultBranch(lsRemoteOutput) {
  const match = REMOTE_HEAD_PATTERN.exec(lsRemoteOutput);
  const branchName = match?.groups?.branch?.trim();

  if (!branchName) {
    throw new Error(
      'Unable to determine the remote default branch from git ls-remote --symref output.',
    );
  }

  return branchName;
}

export function createPushPlan(
  branchName,
  hasRemoteTrackingRef,
  remote = 'origin',
) {
  const remoteHeadRef = `refs/heads/${branchName}`;

  if (hasRemoteTrackingRef) {
    return {
      fetchArgs: [
        'fetch',
        remote,
        `${remoteHeadRef}:refs/remotes/${remote}/${branchName}`,
      ],
      pushArgs: ['push', '--force-with-lease', remote, `HEAD:${remoteHeadRef}`],
      hasRemoteTrackingRef: true,
    };
  }

  return {
    fetchArgs: null,
    pushArgs: ['push', '--set-upstream', remote, `HEAD:${remoteHeadRef}`],
    hasRemoteTrackingRef: false,
  };
}
