import {
  FULL_TEST_TRIGGER_FILES,
  getExtension,
  getQueuedQualityTasks,
  getVitestCommandArgs,
  isLintFile,
  isSrcStyleFile,
  isVitestRelatedFile,
} from '../run-staged-quality.helpers.mjs';

describe('run-staged-quality helpers', () => {
  it('treats runtime JSON sources as related test inputs', () => {
    expect(isVitestRelatedFile('game.config.json')).toBe(true);
    expect(isVitestRelatedFile('src/i18n/locales/en.json')).toBe(true);
  });

  it('does not treat unrelated root JSON files as related test inputs', () => {
    expect(isVitestRelatedFile('tsconfig.json')).toBe(false);
    expect(isVitestRelatedFile('package.json')).toBe(false);
  });

  it('keeps staged Oxlint and Stylelint selectors narrow', () => {
    expect(isLintFile('scripts/run-staged-quality.helpers.mjs')).toBe(true);
    expect(isLintFile('src/i18n/locales/en.json')).toBe(false);
    expect(isSrcStyleFile('src/ui/components/App/styles.scss')).toBe(true);
    expect(isSrcStyleFile('styles.scss')).toBe(false);
  });

  it('keeps shared test trigger files explicit', () => {
    expect(FULL_TEST_TRIGGER_FILES.has('package.json')).toBe(true);
    expect(FULL_TEST_TRIGGER_FILES.has('game.config.json')).toBe(false);
  });

  it('extracts lowercase extensions consistently', () => {
    expect(getExtension('src/i18n/locales/EN.JSON')).toBe('.json');
    expect(getExtension('scripts/run-staged-quality')).toBe('');
  });

  it('builds related Vitest args for staged source changes', () => {
    expect(
      getVitestCommandArgs(['src/game/state.ts', 'game.config.json'], false),
    ).toEqual([
      'exec',
      'vitest',
      'related',
      '--run',
      '--passWithNoTests',
      'src/game/state.ts',
      'game.config.json',
    ]);
  });

  it('builds a full Vitest command when shared inputs change', () => {
    expect(getVitestCommandArgs(['src/game/state.ts'], true)).toEqual(['test']);
  });

  it('queues only the staged quality tasks that actually need to run', () => {
    expect(
      getQueuedQualityTasks(
        ['src/ui/components/App/styles.scss'],
        ['src/game/state.ts'],
        false,
      ),
    ).toEqual([
      {
        name: 'stylelint',
        args: ['exec', 'stylelint', 'src/ui/components/App/styles.scss'],
      },
      {
        name: 'vitest',
        args: [
          'exec',
          'vitest',
          'related',
          '--run',
          '--passWithNoTests',
          'src/game/state.ts',
        ],
      },
    ]);
  });
});
