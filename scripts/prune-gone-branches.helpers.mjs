export function parseBranchRecords(output) {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name = '', upstreamRef = '', headMarker = ''] = line.split('\0');

      return {
        isCurrent: headMarker.trim() === '*',
        name,
        upstreamRef,
      };
    });
}

export function parseCliArgs(argv) {
  const options = {
    dryRun: false,
    fetch: true,
    force: true,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--safe') {
      options.force = false;
      continue;
    }

    if (arg === '--no-fetch') {
      options.fetch = false;
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

export function parseRemoteRefs(output) {
  return new Set(
    output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

export function getGoneBranches(branches, remoteRefs) {
  return branches.filter(
    (branch) =>
      !branch.isCurrent &&
      branch.upstreamRef !== '' &&
      branch.upstreamRef.startsWith('refs/remotes/') &&
      !remoteRefs.has(branch.upstreamRef),
  );
}

export function formatUpstreamRef(upstreamRef) {
  return upstreamRef.replace(/^refs\/remotes\//u, '');
}
