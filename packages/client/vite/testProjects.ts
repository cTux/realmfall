import type { TestProjectConfiguration } from 'vitest/config';

export const VITEST_NODE_INCLUDE = [
  'src/game/**/*.test.ts',
  'src/app/normalize.test.ts',
  'src/app/normalizeShared.test.ts',
  'src/app/tests/**/*.test.ts',
  'src/app/App/tests/reuseVisibleTilesIfUnchanged.test.ts',
  'src/app/App/world/pixiWorldClickNavigation.test.ts',
  'src/app/App/world/hoverAnalysis/**/*.test.ts',
  'src/app/App/world/pixiWorldRenderLoop.test.ts',
  'src/app/App/world/movement/**/*.test.ts',
  'src/app/App/world/tileResolution/**/*.test.ts',
  'src/i18n/**/*.test.ts',
  'src/persistence/**/*.test.ts',
  'scripts/**/*.test.ts',
  'src/ui/world/renderSceneCombatFeedback.test.ts',
  'src/ui/world/renderSceneMovementCooldown.test.ts',
  'src/ui/world/renderScenePlayerResources.test.ts',
];

const VITEST_CANVAS_EXCLUDE = [
  '**/*canvas*.test.ts',
  '**/*canvas*.test.tsx',
  'src/app/App/tests/App.combatAttention.test.tsx',
  'src/app/App/tests/App.hover.test.tsx',
  'src/app/App/tests/App.persistence.test.tsx',
  'src/app/App/tests/App.worldInput.test.tsx',
];

export const VITEST_JSDOM_INCLUDE = ['src/**/*.test.ts', 'src/**/*.test.tsx'];

export const VITEST_PROJECTS = [
  {
    extends: true as const,
    test: {
      name: 'node',
      environment: 'node',
      include: VITEST_NODE_INCLUDE,
      setupFiles: ['src/test/setup.node.ts'],
    },
  },
  {
    extends: true as const,
    test: {
      name: 'jsdom',
      environment: 'jsdom',
      include: VITEST_JSDOM_INCLUDE,
      exclude: VITEST_NODE_INCLUDE.concat(VITEST_CANVAS_EXCLUDE),
      setupFiles: ['src/test/setup.ts'],
    },
  },
] satisfies readonly TestProjectConfiguration[];
