import {
  createNcuArgs,
  DEPENDENCY_SANITY_COMMANDS,
  getDependencyCommitMessage,
  getUnexpectedChangedFiles,
  parseChangedFiles,
  parseCliArgs,
} from '../packages/client/scripts/dependency-updates.helpers.mjs';

describe('dependency update helpers', () => {
  it('parses the supported CLI commands and flags', () => {
    expect(parseCliArgs(['check'])).toEqual({
      command: 'check',
      commit: true,
      help: false,
      target: null,
    });
    expect(parseCliArgs(['update', '--target', 'minor'])).toEqual({
      command: 'update',
      commit: true,
      help: false,
      target: 'minor',
    });
    expect(
      parseCliArgs(['update', '--target', 'major', '--no-commit']),
    ).toEqual({
      command: 'update',
      commit: false,
      help: false,
      target: 'major',
    });
    expect(parseCliArgs(['--help'])).toEqual({
      command: null,
      commit: true,
      help: true,
      target: null,
    });
  });

  it('rejects invalid dependency update CLI usage', () => {
    expect(() => parseCliArgs([])).toThrow(
      'Expected a command: check or update.',
    );
    expect(() => parseCliArgs(['update'])).toThrow(
      'The update command requires --target major or --target minor.',
    );
    expect(() => parseCliArgs(['check', '--target', 'minor'])).toThrow(
      'The check command does not accept --target.',
    );
    expect(() => parseCliArgs(['update', '--target', 'patch'])).toThrow(
      'Expected --target to be followed by major or minor.',
    );
    expect(() => parseCliArgs(['wat'])).toThrow('Unsupported argument: wat');
  });

  it('builds npm-check-updates invocations for check and update flows', () => {
    expect(createNcuArgs({ command: 'check', target: null })).toEqual([
      'exec',
      'npm-check-updates',
      '--packageManager',
      'pnpm',
    ]);
    expect(createNcuArgs({ command: 'update', target: 'minor' })).toEqual([
      'exec',
      'npm-check-updates',
      '-u',
      '--target',
      'minor',
      '--packageManager',
      'pnpm',
    ]);
    expect(createNcuArgs({ command: 'update', target: 'major' })).toEqual([
      'exec',
      'npm-check-updates',
      '-u',
      '--target',
      'latest',
      '--packageManager',
      'pnpm',
    ]);
  });

  it('keeps dependency sanity checks and commit messages consistent', () => {
    expect(DEPENDENCY_SANITY_COMMANDS).toEqual([
      'typecheck',
      'lint',
      'test',
      'build',
    ]);
    expect(getDependencyCommitMessage('minor')).toBe(
      'chore(dependencies): update minor dependency versions',
    );
    expect(getDependencyCommitMessage('major')).toBe(
      'chore(dependencies): update major dependency versions',
    );
  });

  it('parses tracked file diffs and flags unexpected edits', () => {
    expect(parseChangedFiles('package.json\npnpm-lock.yaml\n')).toEqual([
      'package.json',
      'pnpm-lock.yaml',
    ]);
    expect(
      getUnexpectedChangedFiles([
        'package.json',
        'pnpm-lock.yaml',
        'README.md',
      ]),
    ).toEqual(['README.md']);
  });
});
