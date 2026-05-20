import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  chunkFilesByArgumentLength,
  isFormatFile,
  isLintFile,
  isSrcStyleFile,
  isVitestRelatedFile,
  shouldRunFullTestSuite,
} from './run-staged-quality.helpers.mjs';
import { createPnpmInvocation } from '../packages/client-web/scripts/pnpm-command.mjs';

const gitBin = process.platform === 'win32' ? 'git.exe' : 'git';

function run(command, args) {
  const result = spawnSync(command, args, {
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

function getPackageJsonDiffText() {
  return execFileSync(
    gitBin,
    ['diff', '--cached', '--unified=0', '--', 'package.json'],
    {
      encoding: 'utf8',
    },
  );
}

function logStep(message) {
  console.log(`\n> ${message}`);
}

function runChunkedCommand(stepLabel, fixedArgs, fileArgs) {
  const chunks = chunkFilesByArgumentLength(fixedArgs, fileArgs);

  for (const [index, chunk] of chunks.entries()) {
    const suffix = chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : '';
    logStep(`${stepLabel}${suffix}`);
    const pnpm = createPnpmInvocation([...fixedArgs, ...chunk]);
    run(pnpm.command, pnpm.args);
  }
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  logStep('No staged files matched the scoped quality checks');
  process.exit(0);
}

const formatFiles = stagedFiles.filter(isFormatFile);
const lintFiles = stagedFiles.filter(isLintFile);
const stylelintFiles = stagedFiles.filter(isSrcStyleFile);
const packageJsonDiffText = stagedFiles.includes('package.json')
  ? getPackageJsonDiffText()
  : '';
const lintClientFiles = lintFiles.filter((file) =>
  file.startsWith('packages/client-web/'),
);
const hasFullTestTrigger = shouldRunFullTestSuite(
  stagedFiles,
  packageJsonDiffText,
);
const vitestRelatedFiles = stagedFiles.filter(isVitestRelatedFile);
const toAbsolutePaths = (files) => files.map((file) => resolve(file));

if (formatFiles.length > 0) {
  runChunkedCommand(
    `Running Oxfmt on ${formatFiles.length} staged file(s)`,
    ['exec', 'oxfmt', '--config', resolve('.oxfmtrc.jsonc')],
    toAbsolutePaths(formatFiles),
  );
} else {
  logStep('Skipping staged Oxfmt, no matching files');
}

if (lintClientFiles.length > 0) {
  runChunkedCommand(
    `Running Oxlint --fix on ${lintClientFiles.length} staged file(s)`,
    [
      '--filter',
      '@realmfall/client-web',
      'exec',
      'oxlint',
      '-c',
      resolve('.oxlintrc.json'),
      '--fix',
    ],
    toAbsolutePaths(lintClientFiles),
  );
} else {
  logStep('Skipping staged Oxlint, no matching files');
}

if (stylelintFiles.length > 0) {
  runChunkedCommand(
    `Running Stylelint on ${stylelintFiles.length} staged file(s)`,
    ['--filter', '@realmfall/client-web', 'exec', 'stylelint'],
    toAbsolutePaths(stylelintFiles),
  );
} else {
  logStep('Skipping staged Stylelint, no matching files');
}

if (hasFullTestTrigger) {
  logStep(
    'Shared test inputs changed, and full commit validation will run after staged checks',
  );
}

if (vitestRelatedFiles.length > 0) {
  runChunkedCommand(
    `Running Vitest related for ${vitestRelatedFiles.length} staged file(s)`,
    [
      '--filter',
      '@realmfall/client-web',
      'exec',
      'vitest',
      'related',
      '--run',
      '--passWithNoTests',
    ],
    toAbsolutePaths(vitestRelatedFiles),
  );
} else {
  logStep(
    hasFullTestTrigger
      ? 'Skipping scoped Vitest in staged checks because full commit validation runs next'
      : 'Skipping scoped Vitest, no related staged source files',
  );
}
