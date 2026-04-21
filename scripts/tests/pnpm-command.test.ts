import { createPnpmInvocation } from '../pnpm-command.mjs';

describe('pnpm command helper', () => {
  it('wraps pnpm through node when npm_execpath is available', () => {
    const invocation = createPnpmInvocation(
      ['exec', 'vitest'],
      { npm_execpath: '/tooling/pnpm.cjs' },
    );

    expect(invocation.command).toBe(process.execPath);
    expect(invocation.args).toEqual([
      '/tooling/pnpm.cjs',
      'exec',
      'vitest',
    ]);
  });

  it('falls back to the pnpm binary on non-Windows when npm_execpath is absent', () => {
    if (process.platform === 'win32') {
      return;
    }

    const invocation = createPnpmInvocation(['test'], {});

    expect(invocation.command).toBe('pnpm');
    expect(invocation.args).toEqual(['test']);
  });

  it('fails clearly on Windows when npm_execpath is unavailable', () => {
    if (process.platform !== 'win32') {
      return;
    }

    expect(() => createPnpmInvocation(['test'], {})).toThrow(
      /Unable to resolve the pnpm entrypoint on Windows/,
    );
  });
});
