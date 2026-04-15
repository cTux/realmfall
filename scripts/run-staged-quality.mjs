import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';
const pnpmBin = 'pnpm';

const ESLINT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
]);

const STYLELINT_EXTENSIONS = new Set(['.css', '.scss']);

const FULL_TEST_TRIGGER_FILES = new Set([
  'package.json',
  'pnpm-lock.yaml',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'src/test/setup.ts',
]);

function run(command, args) {
  const result = spawnSync(command, args, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getStagedFiles() {
  const output = execFileSync(
    gitBin,
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'],
    { encoding: 'utf8' },
  );

  return output
    .split('\0')
    .filter(Boolean)
    .filter((file) => {
      const absolutePath = resolve(file);
      return existsSync(absolutePath) && statSync(absolutePath).isFile();
    });
}

function getExtension(file) {
  const match = file.match(/(\.[^./\\]+)$/);
  return match?.[1].toLowerCase() ?? '';
}

function isSrcStyleFile(file) {
  return (
    file.startsWith('src/') &&
    STYLELINT_EXTENSIONS.has(getExtension(file))
  );
}

function isEslintFile(file) {
  return ESLINT_EXTENSIONS.has(getExtension(file));
}

function isVitestRelatedFile(file) {
  const extension = getExtension(file);

  if (!ESLINT_EXTENSIONS.has(extension)) {
    return false;
  }

  return (
    file.startsWith('src/') ||
    file.startsWith('scripts/') ||
    file.includes('.test.')
  );
}

function logStep(message) {
  console.log(`\n> ${message}`);
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  logStep('No staged files matched the scoped quality checks');
  process.exit(0);
}

const eslintFiles = stagedFiles.filter(isEslintFile);
const stylelintFiles = stagedFiles.filter(isSrcStyleFile);
const shouldRunFullTestSuite = stagedFiles.some((file) =>
  FULL_TEST_TRIGGER_FILES.has(file),
);
const vitestRelatedFiles = stagedFiles.filter(isVitestRelatedFile);

if (eslintFiles.length > 0) {
  logStep(`Running ESLint --fix on ${eslintFiles.length} staged file(s)`);
  run(pnpmBin, ['exec', 'eslint', '--fix', ...eslintFiles]);
} else {
  logStep('Skipping staged ESLint, no matching files');
}

if (stylelintFiles.length > 0) {
  logStep(`Running Stylelint on ${stylelintFiles.length} staged file(s)`);
  run(pnpmBin, ['exec', 'stylelint', ...stylelintFiles]);
} else {
  logStep('Skipping staged Stylelint, no matching files');
}

if (shouldRunFullTestSuite) {
  logStep('Running full Vitest suite because a shared test input changed');
  run(pnpmBin, ['test']);
} else if (vitestRelatedFiles.length > 0) {
  logStep(
    `Running Vitest related for ${vitestRelatedFiles.length} staged file(s)`,
  );
  run(pnpmBin, [
    'exec',
    'vitest',
    'related',
    '--run',
    '--passWithNoTests',
    ...vitestRelatedFiles,
  ]);
} else {
  logStep('Skipping scoped Vitest, no related staged source files');
}
