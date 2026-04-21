import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import {
  getCommitVersion,
  replacePackageVersion,
} from '../git-commit.helpers.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const gitCommitScriptPath = resolve(process.cwd(), 'scripts/git-commit.mjs');
const isolatedGitEnv = {
  ...process.env,
  GIT_COMMON_DIR: undefined,
  GIT_DIR: undefined,
  GIT_INDEX_FILE: undefined,
  GIT_WORK_TREE: undefined,
};

function runGit(cwd, args) {
  const result = spawnSync(gitBin, args, {
    cwd,
    env: isolatedGitEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    throw new Error(
      (result.stderr || result.stdout || `git ${args.join(' ')} failed`).trim(),
    );
  }

  return result.stdout.trim();
}

function writePackageJson(cwd, version) {
  writeFileSync(
    join(cwd, 'package.json'),
    `${JSON.stringify({ name: 'tmp-repo', version }, null, 2)}\n`,
    'utf8',
  );
}

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

  it('stages an already bumped package.json before retry commits', () => {
    const repoDir = mkdtempSync(join(tmpdir(), 'realmfall-git-commit-'));

    try {
      runGit(repoDir, ['init']);
      runGit(repoDir, ['config', 'user.name', 'Codex Test']);
      runGit(repoDir, ['config', 'user.email', 'codex@example.com']);
      runGit(repoDir, ['config', 'commit.gpgsign', 'false']);

      writePackageJson(repoDir, '0.0.1');
      runGit(repoDir, ['add', 'package.json']);
      runGit(repoDir, ['commit', '-m', 'init']);

      writePackageJson(repoDir, '0.0.2');
      writeFileSync(join(repoDir, 'note.txt'), 'retry commit\n', 'utf8');
      runGit(repoDir, ['add', 'note.txt']);

      const commitResult = spawnSync(
        process.execPath,
        [gitCommitScriptPath, '-m', 'retry commit'],
        {
          cwd: repoDir,
          env: isolatedGitEnv,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      expect(commitResult.status).toBe(0);
      expect(
        JSON.parse(runGit(repoDir, ['show', 'HEAD:package.json'])),
      ).toEqual({
        name: 'tmp-repo',
        version: '0.0.2',
      });
    } finally {
      rmSync(repoDir, { force: true, recursive: true });
    }
  });
});
