import {
  getCommitVersion,
  replacePackageVersion,
} from '../git-commit.helpers.mjs';

describe('git commit helper', () => {
  it('bumps the patch version when package.json matches HEAD', () => {
    expect(getCommitVersion('0.2.274', '0.2.274')).toBe('0.2.275');
  });

  it('keeps an already bumped patch version for retry commits', () => {
    expect(getCommitVersion('0.2.275', '0.2.274')).toBe('0.2.275');
    expect(getCommitVersion('0.2.280', '0.2.274')).toBe('0.2.280');
  });

  it('leaves the version unchanged when HEAD is unavailable', () => {
    expect(getCommitVersion('0.2.275', null)).toBe('0.2.275');
  });

  it('replaces the version line without reformatting package.json', () => {
    const packageJsonText = [
      '{',
      '  "name": "realmfall",',
      '  "version": "0.2.274",',
      '  "scripts": {',
      '    "git:commit": "node scripts/git-commit.mjs"',
      '  }',
      '}',
    ].join('\n');

    expect(replacePackageVersion(packageJsonText, '0.2.275')).toBe(
      [
        '{',
        '  "name": "realmfall",',
        '  "version": "0.2.275",',
        '  "scripts": {',
        '    "git:commit": "node scripts/git-commit.mjs"',
        '  }',
        '}',
      ].join('\n'),
    );
  });
});
