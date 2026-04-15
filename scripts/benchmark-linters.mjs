import { spawnSync } from 'node:child_process';

const iterations = 3;
const lintTargets = [
  'src',
  '.storybook',
  'scripts',
  'eslint.config.js',
  'vite.config.ts',
  'commitlint.config.js',
];

const benchmarks = [
  {
    name: 'eslint',
    args: ['exec', 'eslint', ...lintTargets],
  },
  {
    name: 'oxlint',
    args: ['exec', 'oxlint', ...lintTargets],
  },
  {
    name: 'biome',
    args: [
      'exec',
      'biome',
      'lint',
      '.',
      '--files-ignore-unknown=true',
      '--max-diagnostics=0',
    ],
  },
];

function runBenchmark({ name, args }) {
  const runs = [];
  let exitCode = 0;

  for (let index = 0; index < iterations; index += 1) {
    const start = process.hrtime.bigint();
    const result =
      process.platform === 'win32'
        ? spawnSync('cmd.exe', ['/d', '/s', '/c', `pnpm ${args.join(' ')}`], {
            stdio: 'pipe',
            encoding: 'utf8',
          })
        : spawnSync('pnpm', args, {
            stdio: 'pipe',
            encoding: 'utf8',
          });
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    if (result.error) {
      throw result.error;
    }

    runs.push(elapsedMs);

    if (result.status && exitCode === 0) {
      exitCode = result.status;
    }
  }

  const totalMs = runs.reduce((sum, value) => sum + value, 0);
  const averageMs = totalMs / runs.length;
  const bestMs = Math.min(...runs);

  return {
    name,
    runs,
    exitCode,
    averageMs,
    bestMs,
  };
}

function formatMs(value) {
  return `${value.toFixed(1)}ms`;
}

const results = benchmarks.map(runBenchmark);
const baseline = results.find((result) => result.name === 'eslint');

console.log(`Benchmarking linters across ${iterations} runs on shared targets...`);
console.log(`Targets: ${lintTargets.join(', ')}`);
console.log('');

for (const result of results) {
  const relativeSpeedup =
    baseline && result.name !== baseline.name
      ? `${(baseline.averageMs / result.averageMs).toFixed(2)}x faster than eslint`
      : 'baseline';

  console.log(
    [
      `${result.name}:`,
      `avg ${formatMs(result.averageMs)}`,
      `best ${formatMs(result.bestMs)}`,
      `runs ${result.runs.map(formatMs).join(', ')}`,
      `exit ${result.exitCode}`,
      relativeSpeedup,
    ].join(' | '),
  );
}
