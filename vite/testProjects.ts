export const VITEST_NODE_INCLUDE = [
  'src/game/**/*.test.ts',
  'src/i18n/**/*.test.ts',
  'src/persistence/**/*.test.ts',
  'scripts/**/*.test.ts',
];

export const VITEST_JSDOM_INCLUDE = ['src/**/*.test.ts', 'src/**/*.test.tsx'];

export const VITEST_PROJECTS = [
  {
    extends: true,
    test: {
      name: 'node',
      environment: 'node',
      include: VITEST_NODE_INCLUDE,
      setupFiles: ['src/test/setup.node.ts'],
    },
  },
  {
    extends: true,
    test: {
      name: 'jsdom',
      environment: 'jsdom',
      include: VITEST_JSDOM_INCLUDE,
      exclude: VITEST_NODE_INCLUDE,
      setupFiles: ['src/test/setup.ts'],
    },
  },
];
