import {
  FULL_TEST_TRIGGER_FILES,
  getExtension,
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
});
