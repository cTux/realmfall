const LINT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

const PRETTIER_EXTENSIONS = new Set([
  ...LINT_EXTENSIONS,
  '.css',
  '.scss',
  '.json',
  '.md',
  '.html',
  '.yaml',
  '.yml',
]);

const STYLELINT_EXTENSIONS = new Set(['.css', '.scss']);
const VITEST_RELATED_EXTENSIONS = new Set([...LINT_EXTENSIONS, '.json']);
const PACKAGE_JSON_PATH = 'package.json';
const CLIENT_SRC_DIR = 'packages/client/src';
const CLIENT_GAME_CONFIG_PATH = 'packages/client/game.config.ts';
const PACKAGE_JSON_VERSION_DIFF_LINE_PATTERN =
  /^[-+]\s*"version":\s*"[^"]+",\s*$/u;

export const FULL_TEST_TRIGGER_FILES = new Set([
  'pnpm-lock.yaml',
  'packages/client/vite.config.ts',
  'packages/client/tsconfig.json',
  'packages/client/tsconfig.node.json',
  `${CLIENT_SRC_DIR}/test/setup.node.ts`,
  `${CLIENT_SRC_DIR}/test/setup.shared.ts`,
  `${CLIENT_SRC_DIR}/test/setup.ts`,
]);

export function getExtension(file) {
  const match = file.match(/(\.[^./\\]+)$/);
  return match?.[1].toLowerCase() ?? '';
}

export function isSrcStyleFile(file) {
  return (
    file.startsWith(`${CLIENT_SRC_DIR}/`) &&
    STYLELINT_EXTENSIONS.has(getExtension(file))
  );
}

export function isPrettierFile(file) {
  return PRETTIER_EXTENSIONS.has(getExtension(file));
}

export function isLintFile(file) {
  return LINT_EXTENSIONS.has(getExtension(file));
}

export function isVitestRelatedFile(file) {
  const extension = getExtension(file);

  if (!VITEST_RELATED_EXTENSIONS.has(extension)) {
    return false;
  }

  return (
    file.startsWith(`${CLIENT_SRC_DIR}/`) ||
    file.startsWith('scripts/') ||
    file === CLIENT_GAME_CONFIG_PATH ||
    file.includes('.test.')
  );
}

export function isVersionOnlyPackageJsonDiff(diffText) {
  const changedLines = diffText
    .split('\n')
    .filter(
      (line) =>
        (line.startsWith('+') || line.startsWith('-')) &&
        !line.startsWith('+++') &&
        !line.startsWith('---'),
    );

  return (
    changedLines.length > 0 &&
    changedLines.every((line) =>
      PACKAGE_JSON_VERSION_DIFF_LINE_PATTERN.test(line),
    )
  );
}

export function shouldRunFullTestSuite(stagedFiles, packageJsonDiffText = '') {
  return stagedFiles.some((file) => {
    if (file === PACKAGE_JSON_PATH) {
      return !isVersionOnlyPackageJsonDiff(packageJsonDiffText);
    }

    return FULL_TEST_TRIGGER_FILES.has(file);
  });
}
