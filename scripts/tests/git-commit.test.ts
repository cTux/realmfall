import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const gitCommitScriptPath = resolve(process.cwd(), 'scripts/git-commit.mjs');
const commitVersionBumpScriptPath = resolve(
  process.cwd(),
  'scripts/commit-version-bump.mjs',
);
const isolatedGitEnv = {
  ...process.env,
  REALMFALL_COMMIT_VERSION_BUMPED: undefined,
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

function runScript(cwd, scriptPath, env = isolatedGitEnv) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

describe('git commit helper', () => {
  it('adds a patch version bump to staged commits', () => {
    const repoDir = mkdtempSync(join(tmpdir(), 'realmfall-git-commit-'));

    try {
      runGit(repoDir, ['init']);
      runGit(repoDir, ['config', 'user.name', 'Codex Test']);
      runGit(repoDir, ['config', 'user.email', 'codex@example.com']);
      runGit(repoDir, ['config', 'commit.gpgsign', 'false']);

      writeFileSync(
        join(repoDir, 'package.json'),
        `${JSON.stringify({ name: 'tmp-repo', version: '0.0.1' }, null, 2)}\n`,
        'utf8',
      );
      runGit(repoDir, ['add', 'package.json']);
      runGit(repoDir, ['commit', '-m', 'init']);

      writeFileSync(join(repoDir, 'note.txt'), 'commit helper\n', 'utf8');
      runGit(repoDir, ['add', 'note.txt']);

      const commitResult = spawnSync(
        process.execPath,
        [gitCommitScriptPath, '-m', 'follow-up'],
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
      expect(runGit(repoDir, ['show', 'HEAD:note.txt'])).toBe('commit helper');
    } finally {
      rmSync(repoDir, { force: true, recursive: true });
    }
  });

  it('skips the bump when a parent helper already bumped the commit version', () => {
    const repoDir = mkdtempSync(join(tmpdir(), 'realmfall-version-bump-'));

    try {
      runGit(repoDir, ['init']);
      runGit(repoDir, ['config', 'user.name', 'Codex Test']);
      runGit(repoDir, ['config', 'user.email', 'codex@example.com']);
      runGit(repoDir, ['config', 'commit.gpgsign', 'false']);

      writeFileSync(
        join(repoDir, 'package.json'),
        `${JSON.stringify({ name: 'tmp-repo', version: '0.0.1' }, null, 2)}\n`,
        'utf8',
      );
      runGit(repoDir, ['add', 'package.json']);
      runGit(repoDir, ['commit', '-m', 'init']);

      writeFileSync(join(repoDir, 'note.txt'), 'commit helper\n', 'utf8');
      runGit(repoDir, ['add', 'note.txt']);

      const bumpResult = runScript(repoDir, commitVersionBumpScriptPath, {
        ...isolatedGitEnv,
        REALMFALL_COMMIT_VERSION_BUMPED: '1',
      });

      expect(bumpResult.status).toBe(0);
      expect(JSON.parse(runGit(repoDir, ['show', ':package.json']))).toEqual({
        name: 'tmp-repo',
        version: '0.0.1',
      });
    } finally {
      rmSync(repoDir, { force: true, recursive: true });
    }
  });

  it('signals the helper when there are no staged files to bump yet', () => {
    const repoDir = mkdtempSync(join(tmpdir(), 'realmfall-version-bump-'));

    try {
      runGit(repoDir, ['init']);
      runGit(repoDir, ['config', 'user.name', 'Codex Test']);
      runGit(repoDir, ['config', 'user.email', 'codex@example.com']);
      runGit(repoDir, ['config', 'commit.gpgsign', 'false']);

      writeFileSync(
        join(repoDir, 'package.json'),
        `${JSON.stringify({ name: 'tmp-repo', version: '0.0.1' }, null, 2)}\n`,
        'utf8',
      );
      runGit(repoDir, ['add', 'package.json']);
      runGit(repoDir, ['commit', '-m', 'init']);

      const bumpResult = spawnSync(
        process.execPath,
        [commitVersionBumpScriptPath, '--signal-skip'],
        {
          cwd: repoDir,
          env: isolatedGitEnv,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      expect(bumpResult.status).toBe(10);
      expect(
        JSON.parse(runGit(repoDir, ['show', 'HEAD:package.json'])),
      ).toEqual({
        name: 'tmp-repo',
        version: '0.0.1',
      });
    } finally {
      rmSync(repoDir, { force: true, recursive: true });
    }
  });

  it('refuses to bump when package.json has unstaged edits', () => {
    const repoDir = mkdtempSync(join(tmpdir(), 'realmfall-version-bump-'));

    try {
      runGit(repoDir, ['init']);
      runGit(repoDir, ['config', 'user.name', 'Codex Test']);
      runGit(repoDir, ['config', 'user.email', 'codex@example.com']);
      runGit(repoDir, ['config', 'commit.gpgsign', 'false']);

      writeFileSync(
        join(repoDir, 'package.json'),
        `${JSON.stringify({ name: 'tmp-repo', version: '0.0.1' }, null, 2)}\n`,
        'utf8',
      );
      runGit(repoDir, ['add', 'package.json']);
      runGit(repoDir, ['commit', '-m', 'init']);

      writeFileSync(join(repoDir, 'note.txt'), 'commit helper\n', 'utf8');
      runGit(repoDir, ['add', 'note.txt']);
      writeFileSync(
        join(repoDir, 'package.json'),
        `${JSON.stringify({ name: 'tmp-repo', version: '0.0.5' }, null, 2)}\n`,
        'utf8',
      );

      const bumpResult = runScript(repoDir, commitVersionBumpScriptPath);

      expect(bumpResult.status).not.toBe(0);
      expect(bumpResult.stderr).toContain('package.json has unstaged changes');
      expect(JSON.parse(runGit(repoDir, ['show', ':package.json']))).toEqual({
        name: 'tmp-repo',
        version: '0.0.1',
      });
    } finally {
      rmSync(repoDir, { force: true, recursive: true });
    }
  });
});
