import {
  formatUpstreamRef,
  getGoneBranches,
  parseBranchRecords,
  parseCliArgs,
  parseRemoteRefs,
} from '../prune-gone-branches.helpers.mjs';

describe('prune gone branches helpers', () => {
  it('parses branch records from git for-each-ref output', () => {
    const output = [
      'codex/example\0refs/remotes/origin/codex/example\0 ',
      'master\0refs/remotes/origin/master\0*',
      'local-only\0\0 ',
    ].join('\n');

    expect(parseBranchRecords(output)).toEqual([
      {
        isCurrent: false,
        name: 'codex/example',
        upstreamRef: 'refs/remotes/origin/codex/example',
      },
      {
        isCurrent: true,
        name: 'master',
        upstreamRef: 'refs/remotes/origin/master',
      },
      {
        isCurrent: false,
        name: 'local-only',
        upstreamRef: '',
      },
    ]);
  });

  it('keeps only non-current branches whose upstream ref disappeared', () => {
    const branches = [
      {
        isCurrent: false,
        name: 'codex/old-feature',
        upstreamRef: 'refs/remotes/origin/codex/old-feature',
      },
      {
        isCurrent: false,
        name: 'codex/current-feature',
        upstreamRef: 'refs/remotes/origin/codex/current-feature',
      },
      {
        isCurrent: true,
        name: 'master',
        upstreamRef: 'refs/remotes/origin/master',
      },
      {
        isCurrent: false,
        name: 'scratch',
        upstreamRef: '',
      },
    ];
    const remoteRefs = new Set([
      'refs/remotes/origin/master',
      'refs/remotes/origin/codex/current-feature',
    ]);

    expect(getGoneBranches(branches, remoteRefs)).toEqual([
      {
        isCurrent: false,
        name: 'codex/old-feature',
        upstreamRef: 'refs/remotes/origin/codex/old-feature',
      },
    ]);
  });

  it('parses known flags and rejects unknown ones', () => {
    expect(parseCliArgs([])).toEqual({
      dryRun: false,
      fetch: true,
      force: true,
      help: false,
    });
    expect(parseCliArgs(['--dry-run', '--safe', '--no-fetch'])).toEqual({
      dryRun: true,
      fetch: false,
      force: false,
      help: false,
    });
    expect(parseCliArgs(['--help'])).toEqual({
      dryRun: false,
      fetch: true,
      force: true,
      help: true,
    });
    expect(parseCliArgs(['--safe', '--force'])).toEqual({
      dryRun: false,
      fetch: true,
      force: true,
      help: false,
    });
    expect(() => parseCliArgs(['--wat'])).toThrow(
      'Unsupported argument: --wat',
    );
  });

  it('normalizes remote refs into a lookup set and short labels', () => {
    const remoteRefs = parseRemoteRefs(
      'refs/remotes/origin/master\nrefs/remotes/origin/codex/example\n',
    );

    expect(remoteRefs).toEqual(
      new Set([
        'refs/remotes/origin/master',
        'refs/remotes/origin/codex/example',
      ]),
    );
    expect(formatUpstreamRef('refs/remotes/origin/codex/example')).toBe(
      'origin/codex/example',
    );
  });
});
