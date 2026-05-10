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
const DEFAULT_MAX_ARGUMENT_CHARS = 6_000;
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

export function chunkFilesByArgumentLength(
  fixedArgs,
  fileArgs,
  maxArgumentChars = DEFAULT_MAX_ARGUMENT_CHARS,
) {
  if (fileArgs.length === 0) {
    return [];
  }

  const chunks = [];
  const baseLength = fixedArgs.reduce((total, arg) => total + arg.length, 0);
  let currentChunk = [];
  let currentLength = baseLength;

  for (const fileArg of fileArgs) {
    const nextLength = currentLength + fileArg.length;

    if (currentChunk.length > 0 && nextLength > maxArgumentChars) {
      chunks.push(currentChunk);
      currentChunk = [fileArg];
      currentLength = baseLength + fileArg.length;
      continue;
    }

    currentChunk.push(fileArg);
    currentLength = nextLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
