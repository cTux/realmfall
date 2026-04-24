# User Action Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add intentional user-command entries to the existing log window without logging passive UI noise.

**Architecture:** Add a dedicated `command` log kind to the canonical game log surface, then introduce one focused app-layer helper that wraps command dispatch and appends a localized command log only when the command actually runs. Wire the helper into the primary command entrypoints: app gameplay handlers, action-bar usage, and actionable world-click movement.

**Tech Stack:** TypeScript, React hooks, Vitest (`node` and `jsdom` projects), existing i18n JSON resources

---

### Task 1: Add the Canonical `command` Log Kind and UI Copy Surface

**Files:**

- Modify: `src/game/types.ts`
- Modify: `src/app/constants.ts`
- Modify: `src/i18n/locales/en.json`
- Test: `src/ui/uiVisualHelpers.test.tsx`
- Test: `src/app/normalize.test.ts`

- [ ] **Step 1: Write the failing tests for the new log category**

```ts
// src/ui/uiVisualHelpers.test.tsx
it('includes the command log filter in the default log filter set', () => {
  expect(DEFAULT_LOG_FILTERS.command).toBe(true);
});

// src/app/normalize.test.ts
it('restores a missing command log filter entry during UI normalization', () => {
  expect(
    normalize({
      game: createGame(2, 'normalize-command-filter'),
      ui: {
        windows: DEFAULT_WINDOWS,
        windowShown: DEFAULT_WINDOW_VISIBILITY,
        logFilters: {
          movement: true,
          combat: true,
          loot: true,
          survival: true,
          rumor: true,
          motd: true,
          system: true,
        },
        actionBarSlots: createDefaultActionBarSlots(),
      },
    }).ui.logFilters.command,
  ).toBe(true);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:jsdom -- src/ui/uiVisualHelpers.test.tsx`
Expected: FAIL because `DEFAULT_LOG_FILTERS.command` does not exist

Run: `pnpm test:node -- src/app/normalize.test.ts`
Expected: FAIL because `command` is not part of the canonical log kind/filter shape

- [ ] **Step 3: Add the new log kind and localized label**

```ts
// src/game/types.ts
export const LOG_KINDS = [
  'movement',
  'combat',
  'loot',
  'survival',
  'rumor',
  'motd',
  'system',
  'command',
] as const;
```

```json
// src/i18n/locales/en.json
{
  "ui.log.kind.command.label": "command"
}
```

```ts
// src/app/constants.ts
export function createLogFilters(enabled = true): Record<LogKind, boolean> {
  return Object.fromEntries(
    LOG_KINDS.map((kind) => [kind, enabled] as const),
  ) as Record<LogKind, boolean>;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:jsdom -- src/ui/uiVisualHelpers.test.tsx`
Expected: PASS

Run: `pnpm test:node -- src/app/normalize.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts src/app/constants.ts src/i18n/locales/en.json src/ui/uiVisualHelpers.test.tsx src/app/normalize.test.ts
git commit -m "feat: add command log kind"
```

### Task 2: Build a Reusable App-Level Command Logging Helper

**Files:**

- Create: `src/app/App/hooks/useLoggedGameCommand.ts`
- Create: `src/app/App/hooks/useLoggedGameCommand.test.ts`
- Modify: `src/game/logs.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
// src/app/App/hooks/useLoggedGameCommand.test.ts
import { createGame } from '../../../game/stateFactory';
import { createLoggedGameTransition } from './useLoggedGameCommand';

describe('createLoggedGameTransition', () => {
  it('adds a command log when the transition changes state', () => {
    const game = createGame(2, 'logged-command-change');
    const run = createLoggedGameTransition({
      describe: () => 'You command: start combat.',
      transition: (current) => ({ ...current, turn: current.turn + 1 }),
    });

    const next = run(game);

    expect(next.logs[0]?.kind).toBe('command');
    expect(next.logs[0]?.text).toContain('You command: start combat.');
  });

  it('does not add a command log when the transition returns the same state', () => {
    const game = createGame(2, 'logged-command-noop');
    const run = createLoggedGameTransition({
      describe: () => 'You command: start combat.',
      transition: (current) => current,
    });

    const next = run(game);

    expect(next).toBe(game);
    expect(next.logs[0]?.kind).not.toBe('command');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:node -- src/app/App/hooks/useLoggedGameCommand.test.ts`
Expected: FAIL because `createLoggedGameTransition` does not exist

- [ ] **Step 3: Add the minimal helper and canonical command-log appender**

```ts
// src/game/logs.ts
export function addCommandLog(state: GameState, text: string) {
  addLog(state, 'command', text);
}
```

```ts
// src/app/App/hooks/useLoggedGameCommand.ts
import { addCommandLog } from '../../../game/logs';
import type { GameState } from '../../../game/stateTypes';

interface LoggedGameTransitionOptions {
  describe: (previous: GameState, next: GameState) => string;
  transition: (state: GameState) => GameState;
}

export function createLoggedGameTransition({
  describe,
  transition,
}: LoggedGameTransitionOptions) {
  return (state: GameState) => {
    const next = transition(state);
    if (next === state) {
      return next;
    }

    addCommandLog(next, describe(state, next));
    return next;
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:node -- src/app/App/hooks/useLoggedGameCommand.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logs.ts src/app/App/hooks/useLoggedGameCommand.ts src/app/App/hooks/useLoggedGameCommand.test.ts
git commit -m "feat: add logged game command helper"
```

### Task 3: Wire Command Logging into App Gameplay and Action-Bar Commands

**Files:**

- Modify: `src/app/App/hooks/useGameActionHandlers.ts`
- Modify: `src/app/App/hooks/useActionBarController.ts`
- Create: `src/app/App/hooks/useGameActionHandlers.test.tsx`
- Create: `src/app/App/hooks/useActionBarController.test.tsx`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Write the failing app-hook tests**

```tsx
// src/app/App/hooks/useGameActionHandlers.test.tsx
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '../../../game/stateFactory';
import { useGameActionHandlers } from './useGameActionHandlers';

it('logs a command entry when an intentional inventory action changes game state', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  let latestGame = createGame(2, 'logged-sort-command');
  let handlers: ReturnType<typeof useGameActionHandlers> | null = null;

  function Harness() {
    handlers = useGameActionHandlers({
      paused: false,
      setGame: (value) => {
        latestGame = typeof value === 'function' ? value(latestGame) : value;
      },
      worldTimeMsRef: { current: latestGame.worldTimeMs },
    });
    return null;
  }

  act(() => {
    root.render(createElement(Harness));
  });

  act(() => {
    handlers?.handleSort();
  });

  expect(latestGame.logs[0]?.kind).toBe('command');
});

it('does not log a command entry when paused blocks the command', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  let latestGame = createGame(2, 'paused-sort-command');
  const initialSequence = latestGame.logSequence;
  let handlers: ReturnType<typeof useGameActionHandlers> | null = null;

  function Harness() {
    handlers = useGameActionHandlers({
      paused: true,
      setGame: (value) => {
        latestGame = typeof value === 'function' ? value(latestGame) : value;
      },
      worldTimeMsRef: { current: latestGame.worldTimeMs },
    });
    return null;
  }

  act(() => {
    root.render(createElement(Harness));
  });

  act(() => {
    handlers?.handleSort();
  });

  expect(latestGame.logSequence).toBe(initialSequence);
});

// src/app/App/hooks/useActionBarController.test.tsx
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '../../../game/stateFactory';
import { useActionBarController } from './useActionBarController';

it('logs a command entry when a valid action bar slot is used', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  let latestGame = createGame(2, 'action-bar-command');
  latestGame.player.inventory = [
    {
      id: 'potion-1',
      itemKey: 'health-potion',
      name: 'Health Potion',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 20,
      hunger: 0,
    },
  ];
  let controller: ReturnType<typeof useActionBarController> | null = null;

  function Harness() {
    controller = useActionBarController({
      applyGameTransition: (transition) => {
        latestGame = transition(latestGame);
      },
      gameRef: { current: latestGame },
      inventory: latestGame.player.inventory,
    });
    return null;
  }

  act(() => {
    root.render(createElement(Harness));
  });

  act(() => {
    controller?.handleAssignActionBarSlot(0, latestGame.player.inventory[0]!);
    controller?.handleUseActionBarSlot(0);
  });

  expect(latestGame.logs[0]?.kind).toBe('command');
});

it('does not log when the chosen action bar slot has no valid item', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  let latestGame = createGame(2, 'empty-action-bar-command');
  const initialSequence = latestGame.logSequence;
  let controller: ReturnType<typeof useActionBarController> | null = null;

  function Harness() {
    controller = useActionBarController({
      applyGameTransition: (transition) => {
        latestGame = transition(latestGame);
      },
      gameRef: { current: latestGame },
      inventory: latestGame.player.inventory,
    });
    return null;
  }

  act(() => {
    root.render(createElement(Harness));
  });

  act(() => {
    controller?.handleUseActionBarSlot(0);
  });

  expect(latestGame.logSequence).toBe(initialSequence);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:jsdom -- src/app/App/hooks/useGameActionHandlers.test.tsx src/app/App/hooks/useActionBarController.test.tsx`
Expected: FAIL because command logs are not appended by these hook surfaces

- [ ] **Step 3: Wrap the intentional command handlers and localize their text**

```ts
// src/i18n/locales/en.json
{
  "game.log.command.sortInventory": "You command: sort your inventory.",
  "game.log.command.prospectInventory": "You command: prospect your inventory.",
  "game.log.command.sellAllItems": "You command: sell all tradable equipment.",
  "game.log.command.useItem": "You command: use {itemName}.",
  "game.log.command.equipItem": "You command: equip {itemName}.",
  "game.log.command.unequipItem": "You command: unequip {slotName}.",
  "game.log.command.useActionBarItem": "You command: use {itemName}.",
  "game.log.command.startCombat": "You command: start combat.",
  "game.log.command.forfeitCombat": "You command: forfeit combat."
}
```

```ts
// src/app/App/hooks/useGameActionHandlers.ts
const handleSort = useCallback(() => {
  applyGameTransition(
    createLoggedGameTransition({
      describe: () => t('game.log.command.sortInventory'),
      transition: sortInventory,
    }),
  );
}, [applyGameTransition]);
```

```ts
// src/app/App/hooks/useActionBarController.ts
applyGameTransition(
  createLoggedGameTransition({
    describe: () =>
      t('game.log.command.useActionBarItem', { itemName: item.name }),
    transition: (current) => applyItemUse(current, item.id),
  }),
);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:jsdom -- src/app/App/hooks/useGameActionHandlers.test.tsx src/app/App/hooks/useActionBarController.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/App/hooks/useGameActionHandlers.ts src/app/App/hooks/useActionBarController.ts src/app/App/hooks/useGameActionHandlers.test.tsx src/app/App/hooks/useActionBarController.test.tsx src/i18n/locales/en.json
git commit -m "feat: log app command handlers"
```

### Task 4: Log Actionable World-Click Movement Commands

**Files:**

- Modify: `src/app/App/world/pixiWorldClickNavigation.ts`
- Create: `src/app/App/world/pixiWorldClickNavigation.test.ts`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Write the failing world-click tests**

```ts
// src/app/App/world/pixiWorldClickNavigation.test.ts
import { createWorldClickHandler } from './pixiWorldClickNavigation';
import { createGame } from '../../../game/stateFactory';
import {
  getWorldHexSize,
  tileToPoint,
} from '../../../ui/world/renderSceneMath';

const app = {
  screen: { width: 800, height: 600 },
} as const;

it('adds a command log when clicking an adjacent passable tile moves the player', () => {
  const game = createGame(2, 'adjacent-click-command');
  let nextGame = game;
  const adjacentPoint = tileToPoint(
    { q: 1, r: 0 },
    app.screen.width / 2,
    app.screen.height / 2,
    getWorldHexSize(app.screen, game.radius),
  );
  const handleClick = createWorldClickHandler({
    app,
    gameRef: { current: game },
    getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
    pausedRef: { current: false },
    playerCoordRef: { current: game.player.coord },
    renderInvalidationRef: { current: 0 },
    selectedRef: { current: game.player.coord },
    setGame: (value) => {
      nextGame = typeof value === 'function' ? value(nextGame) : value;
    },
    worldTimeMsRef: { current: game.worldTimeMs },
  });

  handleClick(320, 240);

  expect(nextGame.logs[0]?.kind).toBe('command');
});

it('does not add a command log when clicking an impassable adjacent tile', () => {
  const game = createGame(2, 'blocked-click-command');
  game.tiles['1,0'] = { ...game.tiles['1,0'], terrain: 'mountain' };
  const setGame = vi.fn();
  const adjacentPoint = tileToPoint(
    { q: 1, r: 0 },
    app.screen.width / 2,
    app.screen.height / 2,
    getWorldHexSize(app.screen, game.radius),
  );
  const handleClick = createWorldClickHandler({
    app,
    gameRef: { current: game },
    getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
    pausedRef: { current: false },
    playerCoordRef: { current: game.player.coord },
    renderInvalidationRef: { current: 0 },
    selectedRef: { current: game.player.coord },
    setGame,
    worldTimeMsRef: { current: game.worldTimeMs },
  });

  handleClick(320, 240);

  expect(setGame).not.toHaveBeenCalled();
});

it('adds a command log when clicking a reachable safe-path tile', () => {
  const game = createGame(3, 'safe-path-click-command');
  let nextGame = game;
  const safePathPoint = tileToPoint(
    { q: 2, r: 0 },
    app.screen.width / 2,
    app.screen.height / 2,
    getWorldHexSize(app.screen, game.radius),
  );
  const handleClick = createWorldClickHandler({
    app,
    gameRef: { current: game },
    getScenePoint: () => ({ x: safePathPoint.x, y: safePathPoint.y }),
    pausedRef: { current: false },
    playerCoordRef: { current: game.player.coord },
    renderInvalidationRef: { current: 0 },
    selectedRef: { current: game.player.coord },
    setGame: (value) => {
      nextGame = typeof value === 'function' ? value(nextGame) : value;
    },
    worldTimeMsRef: { current: game.worldTimeMs },
  });

  handleClick(320, 240);

  expect(nextGame.logs[0]?.kind).toBe('command');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:node -- src/app/App/world/pixiWorldClickNavigation.test.ts`
Expected: FAIL because world-click movement does not add command logs

- [ ] **Step 3: Wrap world-click movement with the shared command helper**

```ts
// src/i18n/locales/en.json
{
  "game.log.command.moveToTile": "You command: move to another hex.",
  "game.log.command.followSafePath": "You command: travel along a safe path."
}
```

```ts
// src/app/App/world/pixiWorldClickNavigation.ts
setGame((currentState) =>
  createLoggedGameTransition({
    describe: () => t('game.log.command.moveToTile'),
    transition: (timedState) => moveToTile(timedState, target),
  })({ ...currentState, worldTimeMs: worldTimeMsRef.current }),
);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:node -- src/app/App/world/pixiWorldClickNavigation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/App/world/pixiWorldClickNavigation.ts src/app/App/world/pixiWorldClickNavigation.test.ts src/i18n/locales/en.json
git commit -m "feat: log world movement commands"
```

### Task 5: Align Specs and Run Focused Verification

**Files:**

- Modify: `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`
- Modify: `docs/specs/reference/gameplay-features/ui-surfaced-gameplay/spec.md`
- Modify: `docs/superpowers/specs/2026-04-24-user-action-log-design.md`

- [ ] **Step 1: Write the failing documentation parity check**

```md
Add a short section to the existing shipped technical-solution spec covering:

- the `command` log kind
- the app-layer logged-command helper
- the excluded non-command interactions
```

- [ ] **Step 2: Run the focused verification commands**

Run: `pnpm test:node -- src/app/normalize.test.ts src/app/App/hooks/useLoggedGameCommand.test.ts src/app/App/world/pixiWorldClickNavigation.test.ts`
Expected: PASS

Run: `pnpm test:jsdom -- src/ui/uiVisualHelpers.test.tsx src/app/App/hooks/useGameActionHandlers.test.tsx src/app/App/hooks/useActionBarController.test.tsx`
Expected: PASS

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Update the shipped docs to match the implementation**

```md
Document that intentional player commands now write `command` entries into the
existing log window, while passive UI interactions remain excluded.
```

- [ ] **Step 4: Run final verification**

Run: `pnpm test:node -- src/app/normalize.test.ts src/app/App/hooks/useLoggedGameCommand.test.ts src/app/App/world/pixiWorldClickNavigation.test.ts`
Expected: PASS

Run: `pnpm test:jsdom -- src/ui/uiVisualHelpers.test.tsx src/app/App/hooks/useGameActionHandlers.test.tsx src/app/App/hooks/useActionBarController.test.tsx`
Expected: PASS

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/specs docs/superpowers/specs/2026-04-24-user-action-log-design.md
git commit -m "docs: record command log behavior"
```
