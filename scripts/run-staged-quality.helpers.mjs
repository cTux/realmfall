const LINT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
]);

const STYLELINT_EXTENSIONS = new Set(['.css', '.scss']);
const VITEST_RELATED_EXTENSIONS = new Set([...LINT_EXTENSIONS, '.json']);

export const FULL_TEST_TRIGGER_FILES = new Set([
  'package.json',
  'pnpm-lock.yaml',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'src/test/setup.ts',
]);

export function getExtension(file) {
  const match = file.match(/(\.[^./\\]+)$/);
  return match?.[1].toLowerCase() ?? '';
}

export function isSrcStyleFile(file) {
  return (
    file.startsWith('src/') &&
    STYLELINT_EXTENSIONS.has(getExtension(file))
  );
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
    file.startsWith('src/') ||
    file.startsWith('scripts/') ||
    file === 'game.config.json' ||
    file.includes('.test.')
  );
}

export function getVitestCommandArgs(vitestRelatedFiles, shouldRunFullTestSuite) {
  if (shouldRunFullTestSuite) {
    return ['test'];
  }

  return [
    'exec',
    'vitest',
    'related',
    '--run',
    '--passWithNoTests',
    ...vitestRelatedFiles,
  ];
}

export function getQueuedQualityTasks(
  stylelintFiles,
  vitestRelatedFiles,
  shouldRunFullTestSuite,
) {
  const queuedTasks = [];

  if (stylelintFiles.length > 0) {
    queuedTasks.push({
      name: 'stylelint',
      args: ['exec', 'stylelint', ...stylelintFiles],
    });
  }

  if (shouldRunFullTestSuite || vitestRelatedFiles.length > 0) {
    queuedTasks.push({
      name: 'vitest',
      args: getVitestCommandArgs(vitestRelatedFiles, shouldRunFullTestSuite),
    });
  }

  return queuedTasks;
}
