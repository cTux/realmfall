# Combat Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework hostile hex engagement so encounters start immediately without pre-combat movement, preserve staged hostile targets through victory, remove manual combat start from the UI, and surface live world-map combat feedback through badge updates, floating text, a render-only lunge, and outer cooldown rings.

**Architecture:** Keep encounter ownership in `packages/client/src/game` by extending `CombatState` with explicit engagement metadata and by routing every encounter source through one immediate-start constructor. Keep movement cooldown ownership in the app-side world movement controller: gameplay applies the deferred post-victory step in state, and `usePixiWorld` detects that one-hex combat auto-step to seed the local cooldown ring and move transition. Render combat feedback in focused Pixi helpers under `packages/client/src/ui/world/`, using a bounded gameplay-authored floating-text event list plus render-only player offsets so the world badge system stays the single source for world combat chrome.

**Tech Stack:** React 19, TypeScript, Pixi.js 8, Vitest (node and jsdom), pnpm workspaces, existing Realmfall world movement and combat state helpers.

---

### File Structure

- Create `packages/client/src/game/stateCombatEngagement.ts`: encounter metadata helpers, immediate-start combat creation, and deferred victory auto-step resolution.
- Create `packages/client/src/game/stateCombatEngagement.test.ts`: focused gameplay coverage for adjacent-click, staged-click, and chase engagement metadata plus deferred victory stepping.
- Create `packages/client/src/game/worldFloatingText.ts`: bounded helpers for appending and pruning transient world floating-text events.
- Create `packages/client/src/ui/world/renderSceneCombatFeedback.ts`: render-only player lunge math and floating-text drawing above badge anchors.
- Create `packages/client/src/ui/world/renderSceneCombatFeedback.test.ts`: focused render coverage for lunge offsets and floating-text styling.
- Create `packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx`: app-level hostile-click coverage for adjacent start, staged approach, and post-victory auto-step cooldown.
- Modify `packages/client/src/game/types.ts`: add combat engagement metadata and world floating-text event types to the live game shape.
- Modify `packages/client/src/game/stateCombatState.ts`: route combat creation through the new immediate-start engagement helper inputs.
- Modify `packages/client/src/game/stateCombat.ts`: remove pending-start gating and keep combat progression compatible with always-started encounters.
- Modify `packages/client/src/game/stateMovement.ts`: support hostile engagement without stepping onto the hostile hex first and support staged hostile approach requests.
- Modify `packages/client/src/game/statePathfinding.ts`: add nearest reachable adjacent hostile-staging path resolution.
- Modify `packages/client/src/game/stateCombatEncounterSync.ts`: apply deferred post-victory auto-step before combat teardown logging finishes.
- Modify `packages/client/src/game/stateDungeonWorldClock.ts`: create chase encounters through the immediate-start engagement path and preserve the enemy pre-contact target hex when needed.
- Modify `packages/client/src/game/stateLockedChests.ts` and `packages/client/src/game/stateCombatTreasureGoblin.ts`: keep mimic and follow-on treasure-goblin encounters aligned with immediate-start combat creation.
- Modify `packages/client/src/game/stateCombatPlayerAbility.ts`, `packages/client/src/game/stateCombatEnemyAbility.ts`, `packages/client/src/game/combatStatus.ts`, and `packages/client/src/game/stateItemActions.ts`: emit bounded floating-text events for damage and healing, including crits, lifesteal, status ticks, and consumables.
- Modify `packages/client/src/game/stateClone.ts`, `packages/client/src/game/stateFactory.ts`, `packages/client/src/game/state.ts`, `packages/client/src/game/stateTestHelpers.ts`, `packages/client/src/app/normalizeCombat.ts`, `packages/client/src/app/normalizeGameState.ts`, and `packages/client/src/app/normalize.test.ts`: copy, seed, export, and normalize the new combat metadata and transient world feedback shape.
- Modify `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`: classify hostile clicks before queueing movement and dispatch immediate or staged hostile engagement requests.
- Modify `packages/client/src/app/App/world/movement/worldMovementController.ts` and `packages/client/src/app/App/world/movement/createAppWorldMovementController.ts`: carry staged hostile target metadata to the last queued step and skip cooldown for immediate hostile engagement creation.
- Modify `packages/client/src/app/App/usePixiWorld.ts`: trigger the normal player movement cooldown when a combat victory auto-step is detected and keep the existing move transition path aligned with that forced one-hex move.
- Modify `packages/client/src/app/App/useKeyboardShortcuts.ts`, `packages/client/src/app/App/hooks/useAppShortcutBindings.ts`, `packages/client/src/app/App/hooks/useGameActionHandlers.ts`, `packages/client/src/app/App/hooks/useGameplayAutomation.ts`, `packages/client/src/app/gameplaySettings.ts`, `packages/client/src/app/App/AppWindows.tsx`, and `packages/client/src/app/App/components/appDeferredWindows/hexInfoDeferredWindow.tsx`: remove manual combat-start settings, action handlers, and shortcut plumbing while preserving forfeit and other hex actions.
- Modify `packages/client/src/ui/components/CombatWindow/CombatWindow.tsx`, `packages/client/src/ui/components/CombatWindow/types.ts`, `packages/client/src/ui/components/HexInfoWindow/HexInfoWindow.tsx`, and `packages/client/src/ui/components/HexInfoWindow/types.ts`: remove `Start Combat` actions from visible UI surfaces.
- Modify `packages/client/src/ui/world/renderScene.ts`, `packages/client/src/ui/world/renderSceneAnimated.ts`, `packages/client/src/ui/world/renderScenePlayerBars.ts`, `packages/client/src/ui/world/renderSceneEntityBadge.ts`, `packages/client/src/ui/world/renderSceneCache.ts`, and `packages/client/src/ui/world/renderSceneStaticMarkers.ts`: render live badge updates, outer cooldown rings, floating combat text, and the render-only lunge.
- Modify `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`, `packages/client/src/ui/world/renderSceneEnemyMarkers.test.ts`, `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts`, `packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx`, `packages/client/src/app/App/tests/App.combatAttention.test.tsx`, `packages/client/src/app/App/tests/App.gameplaySettings.test.tsx`, `packages/client/src/app/App/tests/useGameplayAutomation.test.tsx`, `packages/client/src/app/App/useKeyboardShortcuts.test.tsx`, `packages/client/src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx`, and `packages/client/src/i18n/locales/en.json`: keep tests and strings aligned with the new shipped behavior.
- Modify `docs/specs/reference/gameplay-features/combat/spec.md`, `docs/specs/reference/gameplay-features/dungeons/spec.md`, `docs/specs/reference/gameplay-features/game-settings/spec.md`, `docs/specs/reference/gameplay-features/ui-surfaced-gameplay/spec.md`, `docs/specs/reference/gameplay-features/world-exploration/spec.md`, `docs/specs/reference/technical-solutions/combat-system-implementation/spec.md`, `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`, and `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`: document the shipped behavior after the implementation lands.

### Task 1: Make Every Encounter Immediate-Start And Gameplay-Owned

**Files:**

- Create: `packages/client/src/game/stateCombatEngagement.ts`
- Create: `packages/client/src/game/stateCombatEngagement.test.ts`
- Modify: `packages/client/src/game/types.ts`
- Modify: `packages/client/src/game/stateCombatState.ts`
- Modify: `packages/client/src/game/stateCombat.ts`
- Modify: `packages/client/src/game/stateMovement.ts`
- Modify: `packages/client/src/game/stateDungeonWorldClock.ts`
- Modify: `packages/client/src/game/stateLockedChests.ts`
- Modify: `packages/client/src/game/stateCombatTreasureGoblin.ts`
- Modify: `packages/client/src/game/stateCombatEncounterSync.ts`
- Modify: `packages/client/src/game/stateClone.ts`
- Modify: `packages/client/src/game/stateFactory.ts`
- Modify: `packages/client/src/game/state.ts`
- Modify: `packages/client/src/game/stateTestHelpers.ts`
- Modify: `packages/client/src/app/normalizeCombat.ts`
- Modify: `packages/client/src/app/normalizeGameState.ts`
- Modify: `packages/client/src/app/normalize.test.ts`
- Test: `packages/client/src/game/stateCombatEngagement.test.ts`
- Test: `packages/client/src/game/stateCombatEncounters.test.ts`
- Test: `packages/client/src/game/stateDungeonEnemyMovement.test.ts`
- Test: `packages/client/src/app/normalize.test.ts`

- [ ] **Step 1: Write the failing gameplay and normalization tests**

Create `packages/client/src/game/stateCombatEngagement.test.ts` with these cases:

```ts
import { describe, expect, it } from 'vitest';
import { createGame } from './stateFactory';
import {
  applyCombatVictoryAutoStep,
  createStartedCombatEncounter,
} from './stateCombatEngagement';

describe('stateCombatEngagement', () => {
  it('creates an already-started adjacent-click encounter without moving the player first', () => {
    const game = createGame(3, 'adjacent-click-engagement');
    const targetCoord = { q: 1, r: 0 };
    const enemyId = 'enemy-1,0-0';

    game.player.coord = { q: 0, r: 0 };
    game.tiles['1,0'] = {
      coord: targetCoord,
      terrain: 'plains',
      items: [],
      enemyIds: [enemyId],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: targetCoord,
      tier: 1,
      hp: 5,
      maxHp: 5,
      attack: 2,
      defense: 0,
      xp: 1,
      elite: false,
    };

    const combat = createStartedCombatEncounter(game, {
      autoStepOnVictory: true,
      engageMode: 'adjacent-click',
      enemyIds: [enemyId],
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord,
      worldTimeMs: game.worldTimeMs,
    });

    expect(combat?.started).toBe(true);
    expect(combat?.coord).toEqual({ q: 0, r: 0 });
    expect(combat?.engagement).toMatchObject({
      autoStepOnVictory: true,
      engageMode: 'adjacent-click',
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord: { q: 1, r: 0 },
    });
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('steps onto the preserved hostile target when the final enemy dies', () => {
    const game = createGame(3, 'victory-auto-step');
    const enemyId = 'enemy-1,0-0';
    game.player.coord = { q: 0, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    game.combat = createStartedCombatEncounter(game, {
      autoStepOnVictory: true,
      engageMode: 'adjacent-click',
      enemyIds: [enemyId],
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord: { q: 1, r: 0 },
      worldTimeMs: game.worldTimeMs,
    });

    const changed = applyCombatVictoryAutoStep(game);

    expect(changed).toBe(true);
    expect(game.player.coord).toEqual({ q: 1, r: 0 });
  });
});
```

Update `packages/client/src/game/stateCombatEncounters.test.ts` so the encounter-start test asserts the opposite of the current behavior:

```ts
it('starts battle immediately when entering a hostile tile', () => {
  const game = createCombatEncounterGame('combat-immediate-start');
  const target = seedCombatEncounter(game, {
    id: 'enemy-2,0-0',
    name: 'Wolf',
    tier: 1,
    hp: 5,
    maxHp: 5,
    attack: 2,
    defense: 0,
    xp: 5,
    elite: false,
  });

  const encountered = moveToTile(game, target);

  expect(encountered.combat?.started).toBe(true);
  expect(progressCombat(encountered)).not.toBe(encountered);
  expect(
    encountered.logs.some((entry) => /press start/i.test(entry.text)),
  ).toBe(false);
});
```

Update `packages/client/src/game/stateDungeonEnemyMovement.test.ts` so the chase-contact assertion checks the new engagement metadata:

```ts
expect(secondStep.combat?.started).toBe(true);
expect(secondStep.combat?.engagement).toMatchObject({
  autoStepOnVictory: true,
  engageMode: 'enemy-chase',
  stagingCoord: { q: 0, r: 0 },
  targetCoord: { q: 1, r: 0 },
});
```

Add this case to `packages/client/src/app/normalize.test.ts`:

```ts
it('normalizes combat engagement metadata and drops malformed floating-text leftovers', () => {
  const normalized = normalizeLoadedGame({
    seed: 'normalize-combat-engagement',
    radius: 3,
    player: createGame(3, 'normalize-combat-engagement').player,
    tiles: {},
    enemies: {},
    logs: [],
    worlds: createGame(3, 'normalize-combat-engagement').worlds,
    surfaceWorldId: 'surface',
    activeWorldId: 'surface',
    dungeonEntrances: {},
    activeDungeon: null,
    homeHex: { q: 0, r: 0 },
    turn: 0,
    worldTimeMs: 1234,
    dayPhase: 'day',
    bloodMoonActive: false,
    bloodMoonCheckedTonight: false,
    bloodMoonCycle: 0,
    harvestMoonActive: false,
    harvestMoonCheckedTonight: false,
    harvestMoonCycle: 0,
    lastEarthshakeDay: 0,
    gameOver: false,
    logSequence: 0,
    worldFloatingTextEvents: [{ bad: true }],
    combat: {
      coord: { q: 0, r: 0 },
      enemyIds: ['enemy-0,0-0'],
      started: true,
      startedAtMs: 1234,
      engagement: {
        engageMode: 'adjacent-click',
        originCoord: { q: 0, r: 0 },
        stagingCoord: { q: 0, r: 0 },
        targetCoord: { q: 1, r: 0 },
        autoStepOnVictory: true,
      },
      player: {
        abilityIds: ['kick'],
        globalCooldownMs: 1500,
        globalCooldownEndsAt: 1234,
        cooldownEndsAt: {},
        casting: null,
      },
      enemies: {
        'enemy-0,0-0': {
          abilityIds: ['kick'],
          globalCooldownMs: 1500,
          globalCooldownEndsAt: 1234,
          cooldownEndsAt: {},
          casting: null,
        },
      },
      enemyStateById: { 'enemy-0,0-0': {} },
    },
  });

  expect(normalized?.combat?.engagement?.targetCoord).toEqual({ q: 1, r: 0 });
  expect(normalized?.worldFloatingTextEvents ?? []).toEqual([]);
});
```

- [ ] **Step 2: Run the gameplay and normalization tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateCombatEngagement.test.ts src/game/stateCombatEncounters.test.ts src/game/stateDungeonEnemyMovement.test.ts src/app/normalize.test.ts
```

Expected: FAIL because `CombatState` does not yet carry engagement metadata, combat creation leaves `started` false in several paths, and the normalizer does not know about the new shape.

- [ ] **Step 3: Implement immediate-start encounter helpers and deferred victory auto-step**

Create `packages/client/src/game/stateCombatEngagement.ts`:

```ts
import { t } from '../i18n';
import { addLog } from './logs';
import { hexKey, type HexCoord } from './hex';
import { createCombatActorState } from './combat';
import { getPlayerCombatStats } from './progression';
import { createCombatEnemyEncounterState } from './stateCombatTreasureGoblin';
import { isPassable } from './shared';
import type { CombatState, GameState } from './types';

export function createStartedCombatEncounter(
  state: GameState,
  {
    autoStepOnVictory,
    engageMode,
    enemyIds,
    originCoord,
    stagingCoord,
    targetCoord,
    worldTimeMs,
  }: {
    autoStepOnVictory: boolean;
    engageMode: CombatState['engagement']['engageMode'];
    enemyIds: string[];
    originCoord: HexCoord;
    stagingCoord: HexCoord;
    targetCoord: HexCoord | null;
    worldTimeMs: number;
  },
): CombatState {
  const encounterSeed = worldTimeMs;

  const combat: CombatState = {
    coord: { ...stagingCoord },
    enemyIds: [...enemyIds],
    started: true,
    startedAtMs: worldTimeMs,
    engagement: {
      autoStepOnVictory,
      engageMode,
      originCoord: { ...originCoord },
      stagingCoord: { ...stagingCoord },
      targetCoord: targetCoord ? { ...targetCoord } : null,
    },
    player: createCombatActorState(
      worldTimeMs,
      getPlayerCombatStats(state.player).abilityIds,
    ),
    enemies: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatActorState(worldTimeMs, state.enemies[enemyId]?.abilityIds),
      ]),
    ),
    enemyStateById: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatEnemyEncounterState(state, enemyId, encounterSeed),
      ]),
    ),
  };

  addLog(
    state,
    'combat',
    t(
      enemyIds.length === 1
        ? 'game.message.combat.encounter.one'
        : 'game.message.combat.encounter.other',
      { count: enemyIds.length },
    ),
  );

  return combat;
}

export function applyCombatVictoryAutoStep(state: GameState) {
  const engagement = state.combat?.engagement;
  const targetCoord = engagement?.targetCoord;
  if (
    !engagement?.autoStepOnVictory ||
    targetCoord == null ||
    sameCoord(state.player.coord, targetCoord)
  ) {
    return false;
  }

  const tile = state.tiles[hexKey(targetCoord)];
  if (!tile || !isPassable(tile.terrain) || tile.enemyIds.length > 0) {
    return false;
  }

  state.player.coord = { ...targetCoord };
  return true;
}

function sameCoord(left: HexCoord, right: HexCoord) {
  return left.q === right.q && left.r === right.r;
}
```

Update `packages/client/src/game/types.ts` so `CombatState` includes the engagement payload and so the live game shape has the bounded floating-text array that Task 4 will populate:

```ts
export interface CombatEngagementMetadata {
  engageMode: 'adjacent-click' | 'staged-click' | 'enemy-chase' | 'tile-step';
  originCoord: HexCoord;
  stagingCoord: HexCoord;
  targetCoord: HexCoord | null;
  autoStepOnVictory: boolean;
}

export interface WorldFloatingTextEvent {
  id: string;
  anchor:
    | { kind: 'player' }
    | { kind: 'enemy'; enemyId: string; coord: HexCoord };
  amount: number;
  createdAtMs: number;
  kind: 'damage' | 'critical-damage' | 'healing';
}

export interface CombatState {
  coord: HexCoord;
  enemyIds: string[];
  started: boolean;
  startedAtMs?: number;
  engagement: CombatEngagementMetadata;
  player: CombatActorState;
  enemies: Record<string, CombatActorState>;
  enemyStateById: Record<string, CombatEnemyEncounterState>;
}

export interface GameState {
  // existing fields...
  worldFloatingTextEvents: WorldFloatingTextEvent[];
  combat: CombatState | null;
}
```

Update `packages/client/src/game/stateMovement.ts`, `packages/client/src/game/stateDungeonWorldClock.ts`, `packages/client/src/game/stateLockedChests.ts`, and `packages/client/src/game/stateCombatTreasureGoblin.ts` so every encounter source uses `createStartedCombatEncounter(...)` instead of `createCombatState(...)` plus `startCombat(...)`. The hostile-tile path should look like this:

```ts
const hostileEnemyIds = getHostileEnemyIds(next, target);
if (hostileEnemyIds.length > 0) {
  next.combat = createStartedCombatEncounter(next, {
    autoStepOnVictory: false,
    engageMode: 'tile-step',
    enemyIds: hostileEnemyIds,
    originCoord: current,
    stagingCoord: target,
    targetCoord: target,
    worldTimeMs: next.worldTimeMs,
  });
  return next;
}
```

Update `packages/client/src/game/stateCombat.ts` so progress and forfeit no longer guard on `!combat.started`:

```ts
export function attackCombatEnemy(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.noBattle'));
  return progressCombat(state);
}

export function progressCombat(state: GameState): GameState {
  if (!state.combat) return state;

  const next = cloneForWorldMutation(state);
  const changed = resolveCombat(next);
  return changed ? next : state;
}

export function forfeitCombat(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.noBattle'));

  const next = cloneForWorldMutation(state);
  respawnAtNearestTown(next, next.combat!.coord);
  return next;
}
```

Update `packages/client/src/game/stateCombatEncounterSync.ts` so the last-enemy case applies the deferred move before tearing combat down:

```ts
if (enemyIds.length === 0) {
  const moved = applyCombatVictoryAutoStep(state);
  state.combat = null;
  clearConsumableCooldownIfOutOfCombat(state);
  addLog(state, 'combat', t('game.message.combat.over'));
  if (moved) {
    addLog(
      state,
      'movement',
      t('game.message.travel.toHex', {
        q: state.player.coord.q,
        r: state.player.coord.r,
      }),
    );
  }
}
```

Update `packages/client/src/game/stateClone.ts`, `packages/client/src/game/stateFactory.ts`, and `packages/client/src/app/normalizeCombat.ts` to clone, seed, and normalize `combat.engagement` and `worldFloatingTextEvents`, with the normalizer resetting malformed or stale floating-text arrays to `[]`:

```ts
engagement: {
  autoStepOnVictory: combat.engagement.autoStepOnVictory,
  engageMode: combat.engagement.engageMode,
  originCoord: { ...combat.engagement.originCoord },
  stagingCoord: { ...combat.engagement.stagingCoord },
  targetCoord: combat.engagement.targetCoord
    ? { ...combat.engagement.targetCoord }
    : null,
},
```

- [ ] **Step 4: Run the gameplay and normalization tests and verify they pass**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateCombatEngagement.test.ts src/game/stateCombatEncounters.test.ts src/game/stateDungeonEnemyMovement.test.ts src/app/normalize.test.ts
```

Expected: PASS with immediate-start encounters, preserved chase metadata, and normalized engagement payloads all green.

- [ ] **Step 5: Commit the gameplay-owned combat flow**

Run:

```bash
git add packages/client/src/game/stateCombatEngagement.ts packages/client/src/game/stateCombatEngagement.test.ts packages/client/src/game/types.ts packages/client/src/game/stateCombatState.ts packages/client/src/game/stateCombat.ts packages/client/src/game/stateMovement.ts packages/client/src/game/stateDungeonWorldClock.ts packages/client/src/game/stateLockedChests.ts packages/client/src/game/stateCombatTreasureGoblin.ts packages/client/src/game/stateCombatEncounterSync.ts packages/client/src/game/stateClone.ts packages/client/src/game/stateFactory.ts packages/client/src/game/state.ts packages/client/src/game/stateTestHelpers.ts packages/client/src/app/normalizeCombat.ts packages/client/src/app/normalizeGameState.ts packages/client/src/app/normalize.test.ts packages/client/src/game/stateCombatEncounters.test.ts packages/client/src/game/stateDungeonEnemyMovement.test.ts
git commit -m "feat: make combat encounters start immediately"
```

### Task 2: Rework Hostile World Click Routing And Post-Victory Cooldown Triggering

**Files:**

- Create: `packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx`
- Modify: `packages/client/src/game/statePathfinding.ts`
- Modify: `packages/client/src/game/stateMovement.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldClickNavigation.ts`
- Modify: `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts`
- Modify: `packages/client/src/app/App/world/movement/worldMovementController.ts`
- Modify: `packages/client/src/app/App/world/movement/createAppWorldMovementController.ts`
- Modify: `packages/client/src/app/App/usePixiWorld.ts`
- Modify: `packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx`
- Test: `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts`
- Test: `packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx`
- Test: `packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx`

- [ ] **Step 1: Write the failing hostile-click and app-cooldown tests**

Update `packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts` with these cases:

```ts
it('starts an adjacent hostile encounter instead of queueing movement', () => {
  const game = createGame(2, 'adjacent-hostile-click');
  const hostileCoord = { q: 1, r: 0 };
  const hostilePoint = tileToPoint(
    hostileCoord,
    app.screen.width / 2,
    app.screen.height / 2,
    getWorldHexSize(app.screen, game.radius),
  );

  game.tiles['1,0'] = {
    coord: hostileCoord,
    terrain: 'plains',
    items: [],
    enemyIds: ['enemy-1,0-0'],
  };

  const startHostileEngagement = vi.fn();
  const replaceQueuedPath = vi.fn();
  const handleClick = createWorldClickHandler({
    app: app as never,
    gameRef: { current: game },
    getScenePoint: () => ({ x: hostilePoint.x, y: hostilePoint.y }),
    pausedRef: { current: false },
    playerCoordRef: { current: game.player.coord },
    renderInvalidationRef: { current: 0 },
    selectedRef: { current: game.player.coord },
    movementController: {
      replaceQueuedPath,
      startHostileEngagement,
      queueHostileApproach: vi.fn(),
    },
  });

  handleClick(320, 240);

  expect(startHostileEngagement).toHaveBeenCalledWith({ q: 1, r: 0 });
  expect(replaceQueuedPath).not.toHaveBeenCalled();
});

it('queues only the staging path for a distant hostile target', () => {
  const game = createGame(3, 'distant-hostile-click');
  game.tiles['2,0'] = {
    coord: { q: 2, r: 0 },
    terrain: 'plains',
    items: [],
    enemyIds: ['enemy-2,0-0'],
  };

  const queueHostileApproach = vi.fn();
  const hostilePoint = tileToPoint(
    { q: 2, r: 0 },
    app.screen.width / 2,
    app.screen.height / 2,
    getWorldHexSize(app.screen, game.radius),
  );

  const handleClick = createWorldClickHandler({
    app: app as never,
    gameRef: { current: game },
    getScenePoint: () => ({ x: hostilePoint.x, y: hostilePoint.y }),
    pausedRef: { current: false },
    playerCoordRef: { current: game.player.coord },
    renderInvalidationRef: { current: 0 },
    selectedRef: { current: game.player.coord },
    movementController: {
      replaceQueuedPath: vi.fn(),
      startHostileEngagement: vi.fn(),
      queueHostileApproach,
    },
  });

  handleClick(320, 240);

  expect(queueHostileApproach).toHaveBeenCalledWith(
    [{ q: 1, r: 0 }],
    { q: 2, r: 0 },
  );
});
```

Create `packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx`:

```tsx
import { act } from 'react';
import { renderApp, flushLazyModules, loadEncryptedState } from './appTestHarness';
import {
  clickWorldTile,
  getRenderedGame,
  renderTickerFrame,
} from './appWorldMovementTestHelpers';

it('starts adjacent hostile combat without moving first, then auto-steps after the win', async () => {
  const game = createHydratedAppGame();
  loadEncryptedState.mockResolvedValue({ game, ui: {} });
  const hexModule = await import('../../../game/hex');
  const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
  hexAtPointSpy.mockReturnValue({ q: 1, r: 0 });

  try {
    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas')!;
    await clickWorldTile(canvas);
    await flushLazyModules();

    expect(getRenderedGame()?.player.coord).toEqual({ q: 0, r: 0 });
    expect(getRenderedGame()?.combat?.started).toBe(true);
    expect(getRenderedGame()?.combat?.engagement.targetCoord).toEqual({
      q: 1,
      r: 0,
    });

    await act(async () => {
      getRenderedGame()!.enemies['enemy-1,0-0']!.hp = 0;
    });

    await renderTickerFrame();

    expect(getRenderedGame()?.combat).toBeNull();
    expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

    root.unmount();
    host.remove();
  } finally {
    hexAtPointSpy.mockRestore();
  }
}, 10_000);
```

Update `packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx` with a combat-resolution case:

```tsx
it('starts the normal movement cooldown after a combat victory auto-step', async () => {
  // arrange an adjacent hostile click encounter, finish it, then assert the
  // next renderScene call receives movementCooldown.endAtMs.
});
```

- [ ] **Step 2: Run the hostile-click and app-cooldown tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/pixiWorldClickNavigation.test.ts
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/App.worldHostileClickCombat.test.tsx src/app/App/tests/App.worldMovementCooldown.test.tsx
```

Expected: FAIL because the click handler only queues raw paths, the controller cannot carry hostile-target metadata, and the app never seeds movement cooldown after a combat-owned auto-step.

- [ ] **Step 3: Route hostile clicks through staging-aware controller methods and detect post-victory auto-steps in `usePixiWorld`**

Update `packages/client/src/game/statePathfinding.ts` with a focused staging helper:

```ts
export function getSafePathToHostileStagingTile(
  state: PathfindingState,
  hostileTarget: HexCoord,
) {
  const candidatePaths = hexNeighbors(hostileTarget)
    .map((neighbor) => getSafePathToTile(state, neighbor))
    .filter((path): path is HexCoord[] => Boolean(path && path.length > 0));

  if (candidatePaths.length === 0) {
    return null;
  }

  return candidatePaths.sort((left, right) => {
    const lengthDifference = left.length - right.length;
    if (lengthDifference !== 0) {
      return lengthDifference;
    }

    const leftLast = left[left.length - 1]!;
    const rightLast = right[right.length - 1]!;
    return leftLast.q - rightLast.q || leftLast.r - rightLast.r;
  })[0]!;
}
```

Update `packages/client/src/app/App/world/movement/worldMovementController.ts` so it can distinguish plain queued travel from a staged hostile approach:

```ts
interface PendingHostileApproach {
  engageTargetCoord: HexCoord;
}

interface ApplyApprovedStepResult {
  combatStarted: boolean;
}

let pendingHostileApproach: PendingHostileApproach | null = null;

replaceQueuedPath(nextSteps: HexCoord[]) {
  pendingHostileApproach = null;
  queuedSteps = [...nextSteps];
  // existing queue logic
},

queueHostileApproach(nextSteps: HexCoord[], engageTargetCoord: HexCoord) {
  pendingHostileApproach = { engageTargetCoord: { ...engageTargetCoord } };
  queuedSteps = [...nextSteps];
  // existing queue logic
},

startHostileEngagement(targetCoord: HexCoord) {
  clearQueuedTravel();
  applyApprovedStep(getCurrentCoord(), {
    engageMode: 'adjacent-click',
    engageTargetCoord: targetCoord,
    skipMoveSourceCooldown: true,
  });
},
```

Update `packages/client/src/app/App/world/movement/createAppWorldMovementController.ts` so the final staging step can call the gameplay helper without spending another cooldown:

```ts
applyApprovedStep: (
  target: HexCoord,
  options?: {
    engageMode?: 'adjacent-click' | 'staged-click';
    engageTargetCoord?: HexCoord;
    skipMoveSourceCooldown?: boolean;
  },
) => {
  const nextState = createLoggedGameTransition({
    describe: () => t('game.log.command.moveToTile'),
    transition: (timedState) =>
      moveToTile(timedState, target, {
        engageMode: options?.engageMode,
        engageTargetCoord: options?.engageTargetCoord,
      }),
  })({
    ...gameRef.current,
    worldTimeMs: worldTimeMsRef.current,
  });
  // existing state commit
  return { combatStarted: nextState.combat != null };
},
```

Update `packages/client/src/app/App/world/pixiWorldClickNavigation.ts` so hostile tiles branch before plain travel:

```ts
const hostileEnemyIds = tile ? getHostileEnemyIds(current, target) : [];
if (distance === 1 && hostileEnemyIds.length > 0) {
  selectedRef.current = target;
  renderInvalidationRef.current += 1;
  movementController.startHostileEngagement(target);
  return;
}

if (distance > 1 && hostileEnemyIds.length > 0) {
  const stagingPath = getSafePathToHostileStagingTile(current, target);
  if (!stagingPath) {
    return;
  }

  selectedRef.current = target;
  renderInvalidationRef.current += 1;
  movementController.queueHostileApproach(stagingPath, target);
  return;
}
```

Update `packages/client/src/app/App/usePixiWorld.ts` so combat-owned auto-steps start the normal player cooldown ring:

```ts
const previousGameRef = useRef(game);

useEffect(() => {
  const previousGame = previousGameRef.current;
  const previousEngagement = previousGame.combat?.engagement;
  const endedWithAutoStep =
    previousEngagement?.autoStepOnVictory &&
    previousEngagement.targetCoord &&
    !game.combat &&
    sameCoord(game.player.coord, previousEngagement.targetCoord) &&
    !sameCoord(previousGame.player.coord, game.player.coord);

  if (endedWithAutoStep) {
    movementCooldownEndAtRef.current =
      performance.now() + WORLD_MOVE_HEX_COOLDOWN_MS;
    renderInvalidationRef.current += 1;
  }

  previousGameRef.current = game;
}, [game]);
```

- [ ] **Step 4: Run the hostile-click and app-cooldown tests and verify they pass**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/App/world/pixiWorldClickNavigation.test.ts
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/App.worldHostileClickCombat.test.tsx src/app/App/tests/App.worldMovementCooldown.test.tsx
```

Expected: PASS with adjacent hostile clicks starting combat in place, far hostile clicks staging next to the enemy, and victory auto-steps starting the normal movement cooldown ring.

- [ ] **Step 5: Commit the world-click and cooldown integration**

Run:

```bash
git add packages/client/src/game/statePathfinding.ts packages/client/src/game/stateMovement.ts packages/client/src/app/App/world/pixiWorldClickNavigation.ts packages/client/src/app/App/world/pixiWorldClickNavigation.test.ts packages/client/src/app/App/world/movement/worldMovementController.ts packages/client/src/app/App/world/movement/createAppWorldMovementController.ts packages/client/src/app/App/usePixiWorld.ts packages/client/src/app/App/tests/App.worldHostileClickCombat.test.tsx packages/client/src/app/App/tests/App.worldMovementCooldown.test.tsx
git commit -m "feat: route hostile clicks into staged combat"
```

### Task 3: Remove Manual Combat Start From Settings, Shortcuts, And Windows

**Files:**

- Modify: `packages/client/src/app/gameplaySettings.ts`
- Modify: `packages/client/src/app/App/hooks/useGameplayAutomation.ts`
- Modify: `packages/client/src/app/App/useKeyboardShortcuts.ts`
- Modify: `packages/client/src/app/App/useKeyboardShortcuts.test.tsx`
- Modify: `packages/client/src/app/App/hooks/useAppShortcutBindings.ts`
- Modify: `packages/client/src/app/App/hooks/useGameActionHandlers.ts`
- Modify: `packages/client/src/app/App/AppWindows.tsx`
- Modify: `packages/client/src/app/App/AppWindows.actionTypes.ts`
- Modify: `packages/client/src/app/App/components/appDeferredWindows/hexInfoDeferredWindow.tsx`
- Modify: `packages/client/src/ui/components/CombatWindow/CombatWindow.tsx`
- Modify: `packages/client/src/ui/components/CombatWindow/types.ts`
- Modify: `packages/client/src/ui/components/HexInfoWindow/HexInfoWindow.tsx`
- Modify: `packages/client/src/ui/components/HexInfoWindow/types.ts`
- Modify: `packages/client/src/ui/components/HexInfoWindow/tests/HexInfoWindow.test.tsx`
- Modify: `packages/client/src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx`
- Modify: `packages/client/src/app/App/tests/App.gameplaySettings.test.tsx`
- Modify: `packages/client/src/app/App/tests/App.combatAttention.test.tsx`
- Modify: `packages/client/src/app/App/tests/useGameplayAutomation.test.tsx`
- Modify: `packages/client/src/i18n/locales/en.json`
- Test: `packages/client/src/app/App/useKeyboardShortcuts.test.tsx`
- Test: `packages/client/src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx`
- Test: `packages/client/src/app/App/tests/App.gameplaySettings.test.tsx`
- Test: `packages/client/src/app/App/tests/App.combatAttention.test.tsx`
- Test: `packages/client/src/app/App/tests/useGameplayAutomation.test.tsx`

- [ ] **Step 1: Write the failing UI, settings, and shortcut tests**

Update `packages/client/src/app/App/tests/App.gameplaySettings.test.tsx` so only the remaining automation toggles hydrate:

```tsx
it('ignores the removed auto-start combat setting during hydration', async () => {
  const game = moveToTile(createHydratedAppGame(), { q: 1, r: 0 });
  loadEncryptedState.mockResolvedValue({ game, ui: {} });
  window.localStorage.setItem(
    GAMEPLAY_SETTINGS_STORAGE_KEY,
    JSON.stringify({ autoLoot: true, autoStartCombat: true }),
  );

  const { host, root } = await renderApp();

  expect(getRenderedGame()?.combat?.started).toBe(true);

  root.unmount();
  host.remove();
}, 10_000);
```

Update `packages/client/src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx` so the gameplay payload assertion drops `autoStartCombat` and the switch query fails if that label exists:

```tsx
expect(
  Array.from(host.querySelectorAll('label')).some((candidate) =>
    candidate.textContent?.includes(
      t('ui.settings.gameplay.autoStartCombat.label'),
    ),
  ),
).toBe(false);

expect(onSave).toHaveBeenCalledWith({
  audio: DEFAULT_AUDIO_SETTINGS,
  graphics: DEFAULT_GRAPHICS_SETTINGS,
  interface: {
    language: 'en',
    fontFamily: 'ubuntu',
    fontSize: 118,
    interfaceScale: 126,
    showTooltipTags: false,
    windowTransparency: 45,
  },
  gameplay: {
    autoGatherResources: true,
    autoLoot: true,
  },
});
```

Update `packages/client/src/app/App/useKeyboardShortcuts.test.tsx` with:

```tsx
it('uses q for the current hex interact action instead of start combat', () => {
  const onInteract = vi.fn();
  const onStartCombat = vi.fn();

  renderHook(() =>
    useKeyboardShortcuts({
      canBulkProspectEquipment: false,
      canBulkSellEquipment: false,
      canHealTerritoryNpc: false,
      canSetHomeAction: false,
      canTerritoryAction: false,
      combatDeathAvailable: false,
      hexContentWindowShown: true,
      interactLabel: 'Fight',
      lootSnapshotLength: 0,
      onCloseAllWindows: vi.fn(),
      onForfeitCombat: vi.fn(),
      onHealTerritoryNpc: vi.fn(),
      onInteract,
      onProspect: vi.fn(),
      onSellAll: vi.fn(),
      onSetHome: vi.fn(),
      onStartCombat,
      onTakeAllLoot: vi.fn(),
      onTerritoryAction: vi.fn(),
      onTogglePause: vi.fn(),
      onToggleDockWindow: vi.fn(),
      onUseActionBarSlot: vi.fn(),
      windowShown: emptyWindowShown(),
    }),
  );

  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' }));

  expect(onInteract).toHaveBeenCalledTimes(1);
  expect(onStartCombat).not.toHaveBeenCalled();
});
```

Update `packages/client/src/app/App/tests/App.combatAttention.test.tsx` so the battle-open assertion no longer looks for `Start Combat` text:

```tsx
expect(host.textContent).not.toContain(
  stripBracketHotkeyLabel(t('ui.combat.startAction')),
);
expect(updatedHexContentButton?.dataset.opened).toBe('true');
```

- [ ] **Step 2: Run the UI, settings, and shortcut tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/useKeyboardShortcuts.test.tsx src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx src/app/App/tests/App.gameplaySettings.test.tsx src/app/App/tests/App.combatAttention.test.tsx src/app/App/tests/useGameplayAutomation.test.tsx
```

Expected: FAIL because the gameplay settings schema includes `autoStartCombat`, the windows and shortcut bindings expose manual start handlers, and the old `Start Combat` copy is rendered.

- [ ] **Step 3: Remove the manual start wiring and keep only the active-combat affordances**

Update `packages/client/src/app/gameplaySettings.ts`:

```ts
export interface GameplaySettings {
  autoGatherResources: boolean;
  autoLoot: boolean;
}

export const DEFAULT_GAMEPLAY_SETTINGS: GameplaySettings = {
  autoGatherResources: false,
  autoLoot: false,
};

export const GAMEPLAY_SETTINGS_TOGGLE_OPTIONS = [
  {
    key: 'autoLoot',
    labelKey: 'ui.settings.gameplay.autoLoot.label',
    descriptionKey: 'ui.settings.gameplay.autoLoot.description',
  },
  {
    key: 'autoGatherResources',
    labelKey: 'ui.settings.gameplay.autoGatherResources.label',
    descriptionKey: 'ui.settings.gameplay.autoGatherResources.description',
  },
] satisfies GameplaySettingsToggleOptionDefinition[];
```

Update `packages/client/src/app/App/hooks/useGameplayAutomation.ts` so combat is no longer a branch at all:

```ts
if (combat) {
  return;
}

if (gameplaySettings.autoLoot && currentTile.items.length > 0) {
  applyTransition(takeAllTileItems);
  return;
}
```

Update `packages/client/src/app/App/useKeyboardShortcuts.ts` and `packages/client/src/app/App/hooks/useAppShortcutBindings.ts` to remove `combatStartAvailable` entirely:

```ts
interface UseKeyboardShortcutsOptions {
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  canHealTerritoryNpc: boolean;
  canSetHomeAction: boolean;
  canTerritoryAction: boolean;
  combatDeathAvailable: boolean;
  hexContentWindowShown: boolean;
  interactLabel: string | null;
  lootSnapshotLength: number;
  onForfeitCombat: () => void;
  onInteract: () => void;
  // no onStartCombat
}

if (lowerKey === 'q' && interactLabel) {
  event.preventDefault();
  onInteract();
  return;
}
```

Update `packages/client/src/app/App/hooks/useGameActionHandlers.ts`, `packages/client/src/app/App/AppWindows.actionTypes.ts`, `packages/client/src/app/App/components/appDeferredWindows/hexInfoDeferredWindow.tsx`, `packages/client/src/ui/components/CombatWindow/types.ts`, and `packages/client/src/ui/components/HexInfoWindow/types.ts` to remove `handleStartCombat` and `onStartCombat` from the action surface.

Update `packages/client/src/ui/components/CombatWindow/CombatWindow.tsx` and `packages/client/src/ui/components/HexInfoWindow/HexInfoWindow.tsx` so the only combat header action left is forfeit after the existing delay:

```tsx
headerActions: null
```

and:

```tsx
const primaryHeaderAction = combat?.started
  ? showForfeitAction
    ? (
        <WindowHeaderActionButton
          className={inventoryStyles.headerButton}
          onClick={onForfeitCombat}
          tooltipTitle={t('ui.combat.forfeitAction')}
          tooltipLines={[
            { kind: 'text', text: t('ui.tooltip.window.forfeitCombat') },
          ]}
          tooltipBorderColor="rgba(248, 113, 113, 0.9)"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        >
          {t('ui.combat.forfeitAction')}
        </WindowHeaderActionButton>
      )
    : null
  : headerInteractLabel
    ? /* existing interact button */
      null
    : null;
```

Update `packages/client/src/app/App/AppWindows.tsx` so combat attention is tied to active combat, not to a pending manual-start phase:

```ts
const dockAttention = useMemo(
  () => ({
    hexInfo: Boolean(props.views.hex.combat),
  }),
  [props.views.hex.combat],
);
```

Remove the unused `start combat` translation and settings copy from `packages/client/src/i18n/locales/en.json`.

- [ ] **Step 4: Run the UI, settings, and shortcut tests and verify they pass**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/useKeyboardShortcuts.test.tsx src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx src/app/App/tests/App.gameplaySettings.test.tsx src/app/App/tests/App.combatAttention.test.tsx src/app/App/tests/useGameplayAutomation.test.tsx
```

Expected: PASS with no gameplay auto-start toggle, no manual `Start Combat` surfaces, and `Q` reserved for the current hex action instead of the removed combat-start path.

- [ ] **Step 5: Commit the UI and input cleanup**

Run:

```bash
git add packages/client/src/app/gameplaySettings.ts packages/client/src/app/App/hooks/useGameplayAutomation.ts packages/client/src/app/App/useKeyboardShortcuts.ts packages/client/src/app/App/useKeyboardShortcuts.test.tsx packages/client/src/app/App/hooks/useAppShortcutBindings.ts packages/client/src/app/App/hooks/useGameActionHandlers.ts packages/client/src/app/App/AppWindows.tsx packages/client/src/app/App/AppWindows.actionTypes.ts packages/client/src/app/App/components/appDeferredWindows/hexInfoDeferredWindow.tsx packages/client/src/ui/components/CombatWindow/CombatWindow.tsx packages/client/src/ui/components/CombatWindow/types.ts packages/client/src/ui/components/HexInfoWindow/HexInfoWindow.tsx packages/client/src/ui/components/HexInfoWindow/types.ts packages/client/src/ui/components/HexInfoWindow/tests/HexInfoWindow.test.tsx packages/client/src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx packages/client/src/app/App/tests/App.gameplaySettings.test.tsx packages/client/src/app/App/tests/App.combatAttention.test.tsx packages/client/src/app/App/tests/useGameplayAutomation.test.tsx packages/client/src/i18n/locales/en.json
git commit -m "feat: remove manual combat start surfaces"
```

### Task 4: Render World Floating Text, Live Badge Updates, Lunge, And Outer Cooldown Rings

**Files:**

- Create: `packages/client/src/game/worldFloatingText.ts`
- Create: `packages/client/src/ui/world/renderSceneCombatFeedback.ts`
- Create: `packages/client/src/ui/world/renderSceneCombatFeedback.test.ts`
- Modify: `packages/client/src/game/types.ts`
- Modify: `packages/client/src/game/stateClone.ts`
- Modify: `packages/client/src/game/stateCombatPlayerAbility.ts`
- Modify: `packages/client/src/game/stateCombatEnemyAbility.ts`
- Modify: `packages/client/src/game/combatStatus.ts`
- Modify: `packages/client/src/game/stateItemActions.ts`
- Modify: `packages/client/src/ui/world/renderScene.ts`
- Modify: `packages/client/src/ui/world/renderSceneAnimated.ts`
- Modify: `packages/client/src/ui/world/renderScenePlayerBars.ts`
- Modify: `packages/client/src/ui/world/renderSceneEntityBadge.ts`
- Modify: `packages/client/src/ui/world/renderSceneCache.ts`
- Modify: `packages/client/src/ui/world/renderSceneEnemyMarkers.test.ts`
- Modify: `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`
- Test: `packages/client/src/ui/world/renderSceneCombatFeedback.test.ts`
- Test: `packages/client/src/ui/world/renderSceneEnemyMarkers.test.ts`
- Test: `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts`

- [ ] **Step 1: Write the failing render and feedback-event tests**

Create `packages/client/src/ui/world/renderSceneCombatFeedback.test.ts`:

```ts
import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getLabelsLayer,
  getPlayerLayer,
  MockText,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe('renderScene combat feedback', () => {
  it('renders critical damage text in orange with a larger scale and trailing exclamation mark', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-critical-floating-text');
    game.worldFloatingTextEvents = [
      {
        id: 'crit-1',
        anchor: { kind: 'enemy', enemyId: 'enemy-1,0-0', coord: { q: 1, r: 0 } },
        amount: 17,
        createdAtMs: 1_000,
        kind: 'critical-damage',
      },
    ];

    const app = createMockApp();
    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      { worldTimeMs: 1_200 } as never,
    );

    const floatingText = collectDescendants(getLabelsLayer(app)).find(
      (child): child is MockText =>
        child instanceof MockText && child.text === '17!',
    );

    expect(floatingText).toBeDefined();
    expect(getTextFill(floatingText!)).toBe(0xf97316);
    expect(floatingText!.scale.x).toBeGreaterThan(1);
  });

  it('nudges the player wrapper toward the hostile target during combat without changing gameplay coords', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-combat-lunge');
    game.combat = {
      ...makeCombatState({ q: 0, r: 0 }, ['enemy-1,0-0'], 0),
      engagement: {
        autoStepOnVictory: true,
        engageMode: 'adjacent-click',
        originCoord: { q: 0, r: 0 },
        stagingCoord: { q: 0, r: 0 },
        targetCoord: { q: 1, r: 0 },
      },
    };

    const app = createMockApp();
    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    expect(getPlayerLayer(app).children[0]?.position.x ?? 0).toBeGreaterThan(0);
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
  });
});
```

Update `packages/client/src/ui/world/renderSceneMovementCooldown.test.ts` so the player cooldown assertion expects an outer arc instead of the current south-east edge bar:

```ts
expect(cooldownGraphics.some((graphic) => graphic.drawPolygon.mock.calls.length > 0)).toBe(true);
expect(getMaxGraphicRadius(angledArc!)).toBeGreaterThan(getMaxGraphicRadius(manaArc!));
expect(getMaxGraphicRadius(angledArc!) - getMaxGraphicRadius(manaArc!)).toBeGreaterThan(0);
```

Update `packages/client/src/ui/world/renderSceneEnemyMarkers.test.ts` with a live-combat badge refresh case:

```ts
it('rerenders hostile badge hp and mp values when combat mutates the visible enemy', async () => {
  const { renderScene } = await import('./renderScene');
  const game = createEnemyMarkerGame('enemy-badge-live-refresh', 'rare');
  const app = createMockApp();
  const visibleTiles = getVisibleTiles(game);

  renderScene(app as never, game, visibleTiles, game.player.coord, null, 12 * 60);

  renderScene(
    app as never,
    {
      ...game,
      enemies: {
        ...game.enemies,
        'enemy-1,0-0': {
          ...game.enemies['enemy-1,0-0']!,
          hp: 1,
          mana: 1,
        },
      },
    },
    visibleTiles,
    game.player.coord,
    null,
    12 * 60,
  );

  expect(findMarkerArc(collectVisibleBadgeGraphics(app), 0xff2d55, 'top')).toBeDefined();
  expect(findMarkerArc(collectVisibleBadgeGraphics(app), 0x38bdf8, 'bottom')).toBeDefined();
});
```

- [ ] **Step 2: Run the render and feedback-event tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/ui/world/renderSceneCombatFeedback.test.ts src/ui/world/renderSceneEnemyMarkers.test.ts src/ui/world/renderSceneMovementCooldown.test.ts
```

Expected: FAIL because the renderer has no floating-text pipeline, no combat lunge offset, and the cooldown badge geometry uses the current edge-bar implementation.

- [ ] **Step 3: Emit bounded world floating-text events and render them above badge anchors**

Create `packages/client/src/game/worldFloatingText.ts`:

```ts
import type { GameState, HexCoord, WorldFloatingTextEvent } from './types';

const MAX_WORLD_FLOATING_TEXT_EVENTS = 24;

export function appendWorldFloatingTextEvent(
  state: Pick<GameState, 'worldFloatingTextEvents'>,
  event: WorldFloatingTextEvent,
) {
  state.worldFloatingTextEvents = [
    ...state.worldFloatingTextEvents,
    event,
  ].slice(-MAX_WORLD_FLOATING_TEXT_EVENTS);
}

export function createEnemyFloatingTextAnchor(enemyId: string, coord: HexCoord) {
  return { kind: 'enemy', enemyId, coord: { ...coord } } as const;
}
```

Update combat and consumable code so it appends explicit world events instead of expecting the renderer to infer them later:

```ts
appendWorldFloatingTextEvent(state, {
  id: `combat:${state.logSequence}:${enemy.id}`,
  anchor: createEnemyFloatingTextAnchor(enemy.id, enemy.coord),
  amount: damageResolution.damage,
  createdAtMs: state.worldTimeMs,
  kind: damageResolution.critical ? 'critical-damage' : 'damage',
});
```

and:

```ts
appendWorldFloatingTextEvent(state, {
  id: `heal:${state.logSequence}:player`,
  anchor: { kind: 'player' },
  amount: healed,
  createdAtMs: state.worldTimeMs,
  kind: 'healing',
});
```

Use that helper in:

- `packages/client/src/game/stateCombatPlayerAbility.ts`
- `packages/client/src/game/stateCombatEnemyAbility.ts`
- `packages/client/src/game/combatStatus.ts`
- `packages/client/src/game/stateItemActions.ts`

Create `packages/client/src/ui/world/renderSceneCombatFeedback.ts`:

```ts
import { getWorldHexSize, tileToPoint } from './renderSceneMath';
import { takeText } from './renderScenePools';
import type { SceneCache } from './renderSceneCache';
import type { GameState, HexCoord } from '../../game/stateTypes';

const FLOATING_TEXT_LIFETIME_MS = 1_200;
const FLOATING_TEXT_RISE_PX = 22;
const PLAYER_LUNGE_DISTANCE_PX = 10;

export function getCombatLungeOffset({
  combat,
  nowMs,
}: {
  combat: GameState['combat'];
  nowMs: number;
}) {
  const target = combat?.engagement.targetCoord;
  const staging = combat?.engagement.stagingCoord;
  if (!combat || !target || !staging || sameCoord(target, staging)) {
    return { x: 0, y: 0 };
  }

  const dx = target.q - staging.q;
  const dy = target.r - staging.r;
  const length = Math.hypot(dx, dy) || 1;
  const pulse = 0.85 + 0.15 * Math.sin(nowMs / 120);

  return {
    x: (dx / length) * PLAYER_LUNGE_DISTANCE_PX * pulse,
    y: (dy / length) * PLAYER_LUNGE_DISTANCE_PX * pulse,
  };
}

export function renderWorldFloatingText({
  hexSize,
  nowMs,
  origin,
  playerCoord,
  scene,
  state,
}: {
  hexSize: number;
  nowMs: number;
  origin: { x: number; y: number };
  playerCoord: HexCoord;
  scene: SceneCache;
  state: GameState;
}) {
  state.worldFloatingTextEvents
    .filter((event) => nowMs - event.createdAtMs < FLOATING_TEXT_LIFETIME_MS)
    .forEach((event, index) => {
      const age = nowMs - event.createdAtMs;
      const anchorCoord =
        event.anchor.kind === 'player' ? playerCoord : event.anchor.coord;
      const point = tileToPoint(
        {
          q: anchorCoord.q - playerCoord.q,
          r: anchorCoord.r - playerCoord.r,
        },
        origin.x,
        origin.y - hexSize * 0.5 - (age / FLOATING_TEXT_LIFETIME_MS) * FLOATING_TEXT_RISE_PX - index * 6,
        hexSize,
      );
      const label = takeText(scene.labelTexts, getFloatingTextStyle(event.kind));
      label.text =
        event.kind === 'critical-damage'
          ? `${event.amount}!`
          : `${event.amount}`;
      label.anchor.set(0.5);
      label.position.set(point.x, point.y);
      label.alpha = 1 - age / FLOATING_TEXT_LIFETIME_MS;
    });
}
```

Update `packages/client/src/ui/world/renderScene.ts` and `packages/client/src/ui/world/renderSceneAnimated.ts` so the player origin and floating text share the same combat-feedback helper:

```ts
const playerLungeOffset = getCombatLungeOffset({
  combat: state.combat,
  nowMs: renderWorldTimeMs,
});
const playerOrigin = {
  x: origin.x + playerLungeOffset.x,
  y: origin.y + playerLungeOffset.y,
};
```

and:

```ts
renderWorldFloatingText({
  hexSize,
  nowMs: worldTimeMs,
  origin,
  playerCoord,
  scene,
  state,
});
```

Refactor `packages/client/src/ui/world/renderSceneEntityBadge.ts` so the badge arc helper can be reused for the new outer cooldown ring:

```ts
export function drawBadgeArc(
  graphics: ShadowedSpriteEntry['badgeTrackGraphics'],
  options: {
    alpha: number;
    color: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    progress: number;
    startAngle: number;
  },
) {
  // existing arc polygon logic
}

export function getBadgeRingRadii(outerRadius: number) {
  const ringOuterRadius = Math.max(outerRadius - ENTITY_BADGE_ARC_INSET, 1);
  const ringInnerRadius = Math.max(
    1,
    ringOuterRadius -
      Math.max(
        ENTITY_BADGE_MIN_ARC_THICKNESS,
        outerRadius * ENTITY_BADGE_ARC_THICKNESS_RATIO,
      ),
  );

  return { ringInnerRadius, ringOuterRadius };
}
```

Update `packages/client/src/ui/world/renderScenePlayerBars.ts` so both player and dungeon-enemy cooldowns become outer arcs that sit just outside the mana ring:

```ts
const badgeOuterRadius =
  Math.max(18, playerIconSize * 0.78) * ENTITY_BADGE_RADIUS_SCALE;
const { ringOuterRadius } = getBadgeRingRadii(badgeOuterRadius);
const cooldownInnerRadius = ringOuterRadius + Math.max(2, playerIconSize * 0.04);
const cooldownOuterRadius = cooldownInnerRadius + Math.max(3, playerIconSize * 0.075);

drawDetachedWorldArc({
  color: MOVEMENT_COOLDOWN_BAR_COLOR,
  fillAlpha: PLAYER_BAR_FILL_ALPHA,
  innerRadius: cooldownInnerRadius,
  origin,
  outerRadius: cooldownOuterRadius,
  progress,
  startAngle: Math.PI,
  endAngle: 0,
  trackAlpha: PLAYER_BAR_TRACK_ALPHA,
  trackColor: PLAYER_BAR_TRACK_COLOR,
  trackPool: scene.playerCooldownGraphics,
});
```

- [ ] **Step 4: Run the render and feedback-event tests and verify they pass**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/ui/world/renderSceneCombatFeedback.test.ts src/ui/world/renderSceneEnemyMarkers.test.ts src/ui/world/renderSceneMovementCooldown.test.ts
```

Expected: PASS with orange crit text, green healing text, live badge-ring refresh, a render-only player lunge, and outer cooldown arcs for both the player and roaming dungeon enemies.

- [ ] **Step 5: Commit the world feedback renderer**

Run:

```bash
git add packages/client/src/game/worldFloatingText.ts packages/client/src/ui/world/renderSceneCombatFeedback.ts packages/client/src/ui/world/renderSceneCombatFeedback.test.ts packages/client/src/game/types.ts packages/client/src/game/stateClone.ts packages/client/src/game/stateCombatPlayerAbility.ts packages/client/src/game/stateCombatEnemyAbility.ts packages/client/src/game/combatStatus.ts packages/client/src/game/stateItemActions.ts packages/client/src/ui/world/renderScene.ts packages/client/src/ui/world/renderSceneAnimated.ts packages/client/src/ui/world/renderScenePlayerBars.ts packages/client/src/ui/world/renderSceneEntityBadge.ts packages/client/src/ui/world/renderSceneCache.ts packages/client/src/ui/world/renderSceneEnemyMarkers.test.ts packages/client/src/ui/world/renderSceneMovementCooldown.test.ts
git commit -m "feat: add world combat feedback rendering"
```

### Task 5: Update Canonical Specs And Run Full Verification

**Files:**

- Modify: `docs/specs/reference/gameplay-features/combat/spec.md`
- Modify: `docs/specs/reference/gameplay-features/dungeons/spec.md`
- Modify: `docs/specs/reference/gameplay-features/game-settings/spec.md`
- Modify: `docs/specs/reference/gameplay-features/ui-surfaced-gameplay/spec.md`
- Modify: `docs/specs/reference/gameplay-features/world-exploration/spec.md`
- Modify: `docs/specs/reference/technical-solutions/combat-system-implementation/spec.md`
- Modify: `docs/specs/reference/technical-solutions/movement-cooldown/spec.md`
- Modify: `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md`

- [ ] **Step 1: Update the shipped gameplay and technical specs**

Update `docs/specs/reference/gameplay-features/combat/spec.md` so the current behavior section says:

```md
- Entering or triggering any encounter source starts combat immediately.
- Hostile world clicks do not step onto the hostile hex before combat.
- Adjacent hostile clicks keep the player on the staging hex until victory.
- Distant hostile clicks path to the nearest reachable adjacent staging hex and preserve the original hostile target through the encounter.
- Battles that run for longer than `60s` surface a `Dea(t)h` title-bar action that accepts defeat, kills the player, and respawns them at their home hex.
- Winning a hostile-click encounter can auto-step the player onto the preserved hostile target and then trigger the normal movement cooldown.
```

Update `docs/specs/reference/gameplay-features/game-settings/spec.md` to remove the `auto-start combat` gameplay toggle from the shipped settings list.

Update `docs/specs/reference/gameplay-features/world-exploration/spec.md` so hostile destination clicks explicitly describe:

```md
- Clicking an adjacent hostile hex starts combat in place instead of moving onto that hex first.
- Clicking a farther hostile hex paths only to the nearest reachable adjacent staging hex, then starts combat against the originally clicked hostile hex.
- Winning those encounters auto-steps onto the hostile destination and starts the normal movement cooldown.
```

Update `docs/specs/reference/gameplay-features/dungeons/spec.md` and `docs/specs/reference/technical-solutions/movement-cooldown/spec.md` so roaming dungeon enemy chase encounters and their cooldown badges share the same immediate-start combat model and outer ring arc presentation as the player.

Update `docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md` so the world renderer documents:

```md
- live HP and MP badge updates during combat for the player and engaged hostile markers
- a render-only player lunge toward `combat.engagement.targetCoord`
- bounded floating combat text above world badge anchors
- outer cooldown arcs drawn just outside the MP ring for the player and roaming dungeon enemies
```

- [ ] **Step 2: Run the targeted node and jsdom verification for this feature**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateCombatEngagement.test.ts src/game/stateCombatEncounters.test.ts src/game/stateDungeonEnemyMovement.test.ts src/app/App/world/pixiWorldClickNavigation.test.ts src/ui/world/renderSceneCombatFeedback.test.ts src/ui/world/renderSceneEnemyMarkers.test.ts src/ui/world/renderSceneMovementCooldown.test.ts src/app/normalize.test.ts
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/App.worldHostileClickCombat.test.tsx src/app/App/tests/App.worldMovementCooldown.test.tsx src/app/App/tests/App.gameplaySettings.test.tsx src/app/App/tests/App.combatAttention.test.tsx src/app/App/tests/useGameplayAutomation.test.tsx src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx src/app/App/useKeyboardShortcuts.test.tsx
```

Expected: PASS with the targeted gameplay, render, shortcut, settings, and app-hostile-click coverage all green.

- [ ] **Step 3: Run the full workspace verification gates**

Run:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build:budget:strict
```

Expected: PASS with the full test suite, strict typecheck, lint, and build-budget validation all green.

- [ ] **Step 4: Commit the spec updates and final green state**

Run:

```bash
git add docs/specs/reference/gameplay-features/combat/spec.md docs/specs/reference/gameplay-features/dungeons/spec.md docs/specs/reference/gameplay-features/game-settings/spec.md docs/specs/reference/gameplay-features/ui-surfaced-gameplay/spec.md docs/specs/reference/gameplay-features/world-exploration/spec.md docs/specs/reference/technical-solutions/combat-system-implementation/spec.md docs/specs/reference/technical-solutions/movement-cooldown/spec.md docs/specs/reference/technical-solutions/pixi-rendering-solution/spec.md
git commit -m "docs: update combat rework specs"
```
