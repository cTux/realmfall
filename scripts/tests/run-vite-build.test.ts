import {
  filterKnownPluginTimingWarnings,
  shouldSuppressPluginTimingBlock,
} from '../run-vite-build.helpers.mjs';

describe('run-vite-build helpers', () => {
  it('suppresses the known single-plugin vite asset timing warning', () => {
    const warning =
      '\u001B[33m[PLUGIN_TIMINGS] Warning:\u001B[0m Your build spent significant time in plugin `vite:asset`. See https://rolldown.rs/options/checks#plugintimings for more details.\n';

    expect(filterKnownPluginTimingWarnings(warning)).toBe('');
  });

  it('suppresses the known duplicate-deps timing breakdown', () => {
    const warning = [
      '[PLUGIN_TIMINGS] Warning: Your build spent significant time in plugins. Here is a breakdown:',
      '  - unplugin-detect-duplicated-deps (71%)',
      '  - vite:asset (26%)',
      'See https://rolldown.rs/options/checks#plugintimings for more details.',
      '',
    ].join('\n');

    expect(filterKnownPluginTimingWarnings(warning)).toBe('');
  });

  it('suppresses the known visualizer timing breakdown', () => {
    const warning = [
      '[PLUGIN_TIMINGS] Warning: Your build spent significant time in plugins. Here is a breakdown:',
      '  - rollup-plugin-visualizer (74%)',
      '  - vite:asset (19%)',
      'See https://rolldown.rs/options/checks#plugintimings for more details.',
      '',
    ].join('\n');

    expect(filterKnownPluginTimingWarnings(warning)).toBe('');
  });

  it('suppresses the known React Compiler Babel timing breakdown', () => {
    const warning = [
      '[PLUGIN_TIMINGS] Warning: Your build spent significant time in plugins. Here is a breakdown:',
      '  - vite:asset (82%)',
      '  - @rolldown/plugin-babel (14%)',
      'See https://rolldown.rs/options/checks#plugintimings for more details.',
      '',
    ].join('\n');

    expect(filterKnownPluginTimingWarnings(warning)).toBe('');
  });

  it('keeps unexpected plugin timing warnings visible', () => {
    const warning = [
      '[PLUGIN_TIMINGS] Warning: Your build spent significant time in plugins. Here is a breakdown:',
      '  - custom-heavy-plugin (71%)',
      'See https://rolldown.rs/options/checks#plugintimings for more details.',
    ];

    expect(shouldSuppressPluginTimingBlock(warning)).toBe(false);
    expect(filterKnownPluginTimingWarnings(`${warning.join('\n')}\n`)).toBe(
      `${warning.join('\n')}\n`,
    );
  });
});
