import {
  FULL_TEST_TRIGGER_FILES,
  getExtension,
  isLintFile,
  isSrcStyleFile,
  isVitestRelatedFile,
  isVersionOnlyPackageJsonDiff,
  shouldRunFullTestSuite,
} from '../run-staged-quality.helpers.mjs';

describe('run-staged-quality helpers', () => {
  it('treats runtime JSON sources as related test inputs', () => {
    expect(isVitestRelatedFile('packages/client/game.config.ts')).toBe(true);
    expect(isVitestRelatedFile('packages/client/src/i18n/locales/en.json')).toBe(
      true,
    );
  });

  it('does not treat unrelated root JSON files as related test inputs', () => {
    expect(isVitestRelatedFile('tsconfig.json')).toBe(false);
    expect(isVitestRelatedFile('package.json')).toBe(false);
  });

  it('keeps staged Oxlint and Stylelint selectors narrow', () => {
    expect(isLintFile('scripts/run-staged-quality.helpers.mjs')).toBe(true);
    expect(isLintFile('packages/client/src/i18n/locales/en.json')).toBe(false);
    expect(
      isSrcStyleFile('packages/client/src/ui/components/App/styles.scss'),
    ).toBe(true);
    expect(isSrcStyleFile('styles.scss')).toBe(false);
  });

  it('keeps shared test trigger files explicit', () => {
    expect(FULL_TEST_TRIGGER_FILES.has('package.json')).toBe(false);
    expect(
      FULL_TEST_TRIGGER_FILES.has('packages/client/game.config.ts'),
    ).toBe(false);
    expect(FULL_TEST_TRIGGER_FILES.has('packages/client/vite.config.ts')).toBe(
      true,
    );
  });

  it('extracts lowercase extensions consistently', () => {
    expect(
      getExtension('packages/client/src/i18n/locales/EN.JSON'),
    ).toBe('.json');
    expect(getExtension('scripts/run-staged-quality')).toBe('');
  });

  it('treats version-only package.json diffs as lightweight release metadata', () => {
    const versionOnlyDiff = [
      'diff --git a/package.json b/package.json',
      '--- a/package.json',
      '+++ b/package.json',
      '@@ -3 +3 @@',
      '-  "version": "0.2.273",',
      '+  "version": "0.2.274",',
    ].join('\n');
    const scriptDiff = [
      'diff --git a/package.json b/package.json',
      '--- a/package.json',
      '+++ b/package.json',
      '@@ -3,2 +3,2 @@',
      '-  "version": "0.2.273",',
      '+  "version": "0.2.274",',
      '-    "test": "vitest run",',
      '+    "test": "vitest --run",',
    ].join('\n');

    expect(isVersionOnlyPackageJsonDiff(versionOnlyDiff)).toBe(true);
    expect(isVersionOnlyPackageJsonDiff(scriptDiff)).toBe(false);
    expect(shouldRunFullTestSuite(['package.json'], versionOnlyDiff)).toBe(
      false,
    );
    expect(shouldRunFullTestSuite(['package.json'], scriptDiff)).toBe(true);
    expect(
      shouldRunFullTestSuite(['packages/client/vite.config.ts'], ''),
    ).toBe(true);
  });
});
