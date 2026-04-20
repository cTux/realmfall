import {
  CHUNK_BUDGETS,
  findEntryKey,
  formatKiB,
  getChunkBudgetTarget,
  getStartupChunkFiles,
} from '../check-bundle-budget.helpers.mjs';

describe('check-bundle-budget helpers', () => {
  it('formats bundle sizes in kilobytes', () => {
    expect(formatKiB(12_345)).toBe('12.35 kB');
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
        file: 'assets/js/en-abc.js',
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
        'assets/js/en-abc.js',
      ]),
    );
  });

  it('tracks both react-core and background-audio startup chunk budgets', () => {
    expect(CHUNK_BUDGETS).toMatchObject({
      'background-audio': 54_420,
      'react-core': 8_689,
    });
  });

  it('treats react-core as covered by react-dom-vendor when the build merges them', () => {
    const chunks = [
      { fileName: 'react-dom-vendor-abc.js', size: 181_790 },
      { fileName: 'background-audio-abc.js', size: 49_480 },
    ];

    expect(getChunkBudgetTarget(chunks, 'react-core')).toEqual({
      kind: 'merged',
      chunk: { fileName: 'react-dom-vendor-abc.js', size: 181_790 },
      mergedInto: 'react-dom-vendor',
    });
  });
});
