import {
  CHUNK_BUDGETS,
  findEntryKey,
  formatBudgetStatus,
  formatKiB,
  getChunkBudgetTarget,
  getStartupChunkFiles,
  getBundleBudgetExitCode,
  isStrictBundleBudgetMode,
} from '../check-bundle-budget.helpers.mjs';

describe('check-bundle-budget helpers', () => {
  it('formats bundle sizes in kilobytes', () => {
    expect(formatKiB(12_345)).toBe('12.35 kB');
  });

  it('reports budget headroom for near-cap startup chunks', () => {
    expect(formatBudgetStatus('en', 116_300, 121_000)).toBe(
      'en: 116.30 kB within 121.00 kB (4.70 kB headroom, 96.1% used, near cap)',
    );
  });

  it('finds the main entry by source suffix', () => {
    const manifest = {
      'src/main.tsx': { file: 'assets/js/index-abc.js' },
      'src/app/App/index.ts': { file: 'assets/js/App-def.js' },
    };

    expect(findEntryKey(manifest, 'src/main.tsx')).toBe('src/main.tsx');
  });

  it('collects the startup graph without traversing nested lazy window chunks', () => {
    const manifest = {
      'src/main.tsx': {
        file: 'assets/js/index-abc.js',
        imports: ['node_modules/react.js', 'node_modules/react-dom.js'],
        dynamicImports: ['src/app/App/index.ts', 'src/i18n/locales/en.json'],
      },
      'node_modules/react.js': {
        file: 'assets/js/react-core-abc.js',
      },
      'node_modules/react-dom.js': {
        file: 'assets/js/react-dom-vendor-abc.js',
      },
      'src/app/App/index.ts': {
        file: 'assets/js/App-abc.js',
        imports: ['src/game/state.ts'],
        dynamicImports: [
          'src/ui/components/InventoryWindow/InventoryWindowContent.tsx',
        ],
      },
      'src/game/state.ts': {
        file: 'assets/js/state-abc.js',
      },
      'src/i18n/locales/en.json': {
        file: 'assets/misc/en-abc.json',
      },
      'src/ui/components/InventoryWindow/InventoryWindowContent.tsx': {
        file: 'assets/js/InventoryWindowContent-abc.js',
      },
    };

    expect(getStartupChunkFiles(manifest, 'src/main.tsx')).toEqual(
      new Set([
        'assets/js/index-abc.js',
        'assets/js/react-core-abc.js',
        'assets/js/react-dom-vendor-abc.js',
        'assets/js/App-abc.js',
        'assets/js/state-abc.js',
        'assets/misc/en-abc.json',
      ]),
    );
  });

  it('excludes lazy Pixi and audio domain chunks from startup budget files', () => {
    const manifest = {
      'src/main.tsx': {
        file: 'assets/js/index-abc.js',
        dynamicImports: ['src/app/App/index.ts'],
      },
      'src/app/App/index.ts': {
        file: 'assets/js/App-abc.js',
        imports: [
          'node_modules/howler/dist/howler.js',
          'node_modules/pixi.js/lib/index.mjs',
          'src/game/state.ts',
        ],
      },
      'node_modules/howler/dist/howler.js': {
        file: 'assets/js/background-audio-abc.js',
      },
      'node_modules/pixi.js/lib/index.mjs': {
        file: 'assets/js/pixi-abc.js',
      },
      'src/game/state.ts': {
        file: 'assets/js/state-abc.js',
      },
    };

    expect(getStartupChunkFiles(manifest, 'src/main.tsx')).toEqual(
      new Set([
        'assets/js/index-abc.js',
        'assets/js/App-abc.js',
        'assets/js/state-abc.js',
      ]),
    );
  });

  it('tracks React Compiler and core startup chunk budgets', () => {
    expect(CHUNK_BUDGETS).toMatchObject({
      App: 92_000,
      'background-audio': 54_420,
      'react-core': 8_689,
    });
  });

  it('requires a direct react-core chunk budget target', () => {
    const chunks = [
      { fileName: 'react-dom-vendor-abc.js', size: 181_790 },
      { fileName: 'background-audio-abc.js', size: 49_480 },
    ];

    expect(getChunkBudgetTarget(chunks, 'react-core')).toBeNull();
  });

  it('keeps the default budget command warning-only', () => {
    expect(isStrictBundleBudgetMode([], {})).toBe(false);
    expect(getBundleBudgetExitCode(['App over budget'], false)).toBe(0);
  });

  it('supports strict budget failures from CLI and environment flags', () => {
    expect(isStrictBundleBudgetMode(['--strict'], {})).toBe(true);
    expect(
      isStrictBundleBudgetMode([], {
        REALMFALL_BUNDLE_BUDGET_STRICT: '1',
      }),
    ).toBe(true);
    expect(getBundleBudgetExitCode(['App over budget'], true)).toBe(1);
    expect(getBundleBudgetExitCode([], true)).toBe(0);
  });
});
