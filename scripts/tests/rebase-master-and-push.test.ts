import {
  createPushPlan,
  parseCliArgs,
  replacePackageVersionConflict,
  resolveRebasedPackageVersion,
} from '../rebase-master-and-push.helpers.mjs';

describe('rebase master and push helpers', () => {
  it('parses supported CLI flags', () => {
    expect(parseCliArgs([])).toEqual({
      dryRun: false,
      help: false,
    });
    expect(parseCliArgs(['--dry-run'])).toEqual({
      dryRun: true,
      help: false,
    });
    expect(parseCliArgs(['--help'])).toEqual({
      dryRun: false,
      help: true,
    });
    expect(() => parseCliArgs(['--wat'])).toThrow(
      'Unsupported argument: --wat',
    );
  });

  it('replays branch patch increments on top of the incoming version', () => {
    expect(resolveRebasedPackageVersion('0.2.265', '0.2.271', '0.2.266')).toBe(
      '0.2.272',
    );
    expect(resolveRebasedPackageVersion('0.2.265', '0.2.271', '0.2.267')).toBe(
      '0.2.273',
    );
  });

  it('replaces a package version conflict block without touching other content', () => {
    const conflictedText = [
      '{',
      '  "name": "realmfall",',
      '<<<<<<< HEAD',
      '  "version": "0.2.271",',
      '=======',
      '  "version": "0.2.266",',
      '>>>>>>> branch',
      '  "scripts": {',
      '    "git:rebase-master-and-push": "node scripts/rebase-master-and-push.mjs"',
      '  }',
      '}',
    ].join('\n');

    expect(replacePackageVersionConflict(conflictedText, '0.2.272')).toBe(
      [
        '{',
        '  "name": "realmfall",',
        '  "version": "0.2.272",',
        '  "scripts": {',
        '    "git:rebase-master-and-push": "node scripts/rebase-master-and-push.mjs"',
        '  }',
        '}',
      ].join('\n'),
    );
  });

  it('creates lease-aware push plans for existing remote branches', () => {
    expect(createPushPlan('codex/example', true)).toEqual({
      fetchArgs: [
        'fetch',
        'origin',
        'refs/heads/codex/example:refs/remotes/origin/codex/example',
      ],
      pushArgs: [
        'push',
        '--force-with-lease',
        'origin',
        'HEAD:refs/heads/codex/example',
      ],
      hasRemoteTrackingRef: true,
    });
    expect(createPushPlan('codex/example', false)).toEqual({
      fetchArgs: null,
      pushArgs: [
        'push',
        '--set-upstream',
        'origin',
        'HEAD:refs/heads/codex/example',
      ],
      hasRemoteTrackingRef: false,
    });
  });
});
