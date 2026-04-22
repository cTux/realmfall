import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';

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

describe('git commit helper', () => {
  it('commits staged changes without mutating package.json', () => {
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
        version: '0.0.1',
      });
      expect(runGit(repoDir, ['show', 'HEAD:note.txt'])).toBe('commit helper');
    } finally {
      rmSync(repoDir, { force: true, recursive: true });
    }
  });
});
