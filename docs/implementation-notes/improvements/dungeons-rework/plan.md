# Dungeons Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn surface dungeon landmarks into persistent per-entrance dungeon instances with their own themed maps, enemies, elite chest clear flow, leave or return teleporting, fullscreen entry loading, and dedicated per-dungeon persistence.

**Architecture:** Keep the surface world and dungeon worlds in a `worlds` registry keyed by `activeWorldId`, but preserve top-level `tiles` and `enemies` as synced aliases to the active world so most gameplay and Pixi code can stay local to the current instance. Generate each dungeon eagerly from a themed template registry, pad it with explicit wall tiles so the renderer never has to synthesize surface terrain inside a dungeon, and persist each dungeon body under its own encrypted storage key while the main game save keeps only surface data plus dungeon routing metadata.

**Tech Stack:** React 19, TypeScript, Pixi.js 8, Vitest (node and jsdom), Storybook, IndexedDB or localStorage encrypted persistence, pnpm workspaces.

---

### File Structure

- Create `packages/client/src/game/dungeons/types.ts`: world-instance, dungeon template, dungeon theme, entrance routing, and active-run type definitions.
- Create `packages/client/src/game/dungeons/worldState.ts`: helpers for creating worlds, syncing active-world aliases, switching between worlds, and building active-world tiles.
- Create `packages/client/src/game/dungeons/worldState.test.ts`: regression coverage for alias syncing, dungeon fallbacks, and world switches.
- Create `packages/client/src/game/dungeons/generation/dungeonThemes.ts`: dungeon theme catalog and terrain group definitions.
- Create `packages/client/src/game/dungeons/generation/dungeonTemplates.ts`: layout-family registry for `rooms-and-corridors`, `branching-spine`, and `dense-maze`.
- Create `packages/client/src/game/dungeons/generation/generateDungeonWorld.ts`: deterministic dungeon generator that emits a padded world instance, elite, and chest placement.
- Create `packages/client/src/game/dungeons/generation/generateDungeonWorld.test.ts`: generator coverage for size, safety, wall padding, theme choice, and end-room placement.
- Create `packages/client/src/game/stateDungeonActions.ts`: pure enter, leave, activate, clear, and recover helpers for dungeon instances.
- Create `packages/client/src/game/stateDungeonChest.ts`: closed-chest interaction flow gated by the final elite.
- Create `packages/client/src/game/stateDungeonActions.test.ts`: gameplay coverage for enter or leave teleporting, death recovery, clear gating, and retired re-entry.
- Create `packages/client/src/app/App/hooks/useDungeonTransitionController.ts`: async fullscreen dungeon-entry controller that paints loading before generation or load.
- Create `packages/client/src/app/App/tests/App.dungeonFlow.test.tsx`: app-level coverage for `Enter dungeon`, loading overlay, and `Leave dungeon`.
- Create `packages/client/src/app/App/persistence/dungeonSaveSegments.ts`: dedicated dungeon-body snapshot and serialization helpers.
- Create `packages/client/scripts/generate-dungeon-terrain-variants.mjs`: deterministic terrain-variant generator for new dungeon atlas images.
- Create `docs/specs/reference/gameplay-features/dungeons/spec.md`: canonical shipped dungeon feature spec.
- Modify `packages/client/src/game/types.ts`: add dungeon terrain ids, `dungeon-chest`, and the expanded `GameState` shape.
- Modify `packages/client/src/game/stateTypes.ts`: re-export the new dungeon and world types.
- Modify `packages/client/src/game/stateFactory.ts`: bootstrap a surface world registry and sync the active aliases.
- Modify `packages/client/src/game/stateClone.ts`: deep-copy `worlds`, resync aliases, and preserve active dungeon routing metadata.
- Modify `packages/client/src/game/stateMutationHelpers.ts`: clone world registries in the mutation helpers that currently copy only top-level `tiles` and `enemies`.
- Modify `packages/client/src/game/world.ts`: route tile building through the active world and stop auto-clearing dungeon entrance or dungeon chest structures.
- Modify `packages/client/src/game/stateWorldQueries.ts`: build unresolved tiles through the active-world helper and classify dungeon enemies by world kind instead of the tile structure alone.
- Modify `packages/client/src/game/stateWorldActions.ts`: dispatch non-gather dungeon-chest interactions while keeping gathering behavior intact.
- Modify `packages/client/src/game/worldTileGeneration.ts`: stop generating surface enemies on dungeon entrance tiles.
- Modify `packages/client/src/game/stateWorldEvents.ts`: spawn earthshake dungeon entrances without enemies and register stable entrance ids.
- Modify `packages/client/src/game/stateWorldEvents.test.ts`: replace the old disappearing-dungeon regression with permanent-entrance coverage.
- Modify `packages/client/src/game/stateWorldClock.ts`: keep blood moon, harvest moon, and earthshake mutations surface-only while preserving global time flow.
- Modify `packages/client/src/game/stateSurvival.ts`: move dungeon deaths back to the surface without discarding dungeon instance progress.
- Modify `packages/client/src/game/stateRewards.ts`: award dungeon rarity bonuses from dungeon enemy tags instead of the local tile structure only.
- Modify `packages/client/src/game/state.ts` and `packages/client/src/game/stateSelectors.ts`: export the new dungeon helpers.
- Modify `packages/client/src/game/worldTileResolutionPayloads.ts`: keep worker-side tile hydration on the surface path only.
- Modify `packages/client/src/game/worldTerrain.ts`: add dungeon terrain profiles and a dungeon biome branch.
- Modify `packages/client/src/game/content/structures/dungeon.ts`: keep the entrance config as a permanent landmark.
- Modify `packages/client/src/game/content/structures/structureCatalog.ts`: register `dungeon-chest` and keep localized labels wired through the catalog.
- Modify `packages/client/src/game/content/structures/index.test.ts`: cover the new dungeon chest config and dynamic text.
- Modify `packages/client/src/app/normalizeGameState.ts`, `packages/client/src/app/normalizeShared.ts`, and `packages/client/src/app/normalize.test.ts`: normalize the new world registry, dungeon routing metadata, and `dungeon-chest`.
- Modify `packages/client/src/persistence/storage.ts` and `packages/client/src/persistence/storage.test.ts`: add dedicated dungeon save keys and clear-by-prefix support.
- Modify `packages/client/src/app/App/persistence/saveSegments.ts`: serialize only the main game and UI segments, with surface-world tiles in the main payload.
- Modify `packages/client/src/app/App/persistence/saveScheduler.ts`: enqueue dedicated dungeon payload saves beside the existing game and UI saves.
- Modify `packages/client/src/app/App/useAppPersistence.ts`: hydrate the active dungeon body when present, regenerate or return to surface when a dungeon payload is missing, and persist dirty dungeon ids separately.
- Modify `packages/client/src/app/App/tests/useAppPersistence.test.tsx` and `packages/client/src/app/App/tests/appTestHarness.tsx`: mock the new dungeon storage helpers and cover hydration or autosave behavior.
- Modify `packages/client/src/app/App/hooks/useHexGameplayView.ts`: resolve `Enter dungeon`, `Leave dungeon`, and `Open chest` actions from current world state.
- Modify `packages/client/src/app/App/useAppGameView.ts`: pass the active world kind and interact action through the app view model.
- Modify `packages/client/src/app/App/AppWindows.viewTypes.ts`: replace the plain string interact state with a typed action record.
- Modify `packages/client/src/app/App/hooks/useAppRuntime.ts`: wire the dungeon transition controller into the existing app loading flow and shortcut bindings.
- Modify `packages/client/src/app/App/usePixiWorld.ts`: pause background tile resolution while inside a dungeon and rebuild visible tiles from the eagerly generated dungeon map.
- Modify `packages/client/src/app/audio/backgroundMusic.ts` and `packages/client/src/app/audio/backgroundMusic.test.ts`: resolve dungeon music by world kind instead of only the current tile structure.
- Modify `packages/client/src/ui/components/HexInfoWindow/types.ts`, `HexInfoWindow.tsx`, `HexInfoWindowContent.tsx`, `tests/HexInfoWindowContent.test.tsx`, and `HexInfoWindowContent.stories.tsx`: show explicit dungeon entry or exit buttons in the content window and keep the header action label aligned with the interaction kind.
- Modify `packages/client/src/app/App/components/AppShell.tsx` and `AppShell.test.tsx`: keep the existing fullscreen loading shell active during dungeon entry and route dungeon-load failures through the same blocking overlay.
- Modify `packages/client/src/i18n/locales/en.json`: add terrain, chest, and button text for the new dungeon content.
- Modify `packages/client/scripts/world-terrain-atlas.config.mjs`, `packages/client/src/assets/generated/world-terrain-atlas.json`, and `packages/client/src/assets/generated/world-terrain-atlas.png`: include the new dungeon terrain frames in the atlas build.
- Modify `docs/specs/reference/gameplay-features/README.md`, `background-music/spec.md`, `enemies-and-world-events/spec.md`, `ui-surfaced-gameplay/spec.md`, `world-exploration/spec.md`, `docs/specs/reference/technical-solutions/deterministic-world-generation/spec.md`, `persistence-and-save-compatibility/spec.md`, and `react-app-orchestration/spec.md`: document the shipped dungeon flow and the new persistence or orchestration behavior.

### Task 1: Add The World Registry And Active-World Runtime

**Files:**

- Create: `packages/client/src/game/dungeons/types.ts`
- Create: `packages/client/src/game/dungeons/worldState.ts`
- Create: `packages/client/src/game/dungeons/worldState.test.ts`
- Modify: `packages/client/src/game/types.ts`
- Modify: `packages/client/src/game/stateTypes.ts`
- Modify: `packages/client/src/game/stateFactory.ts`
- Modify: `packages/client/src/game/stateClone.ts`
- Modify: `packages/client/src/game/stateMutationHelpers.ts`
- Modify: `packages/client/src/game/world.ts`
- Modify: `packages/client/src/game/stateWorldQueries.ts`
- Modify: `packages/client/src/game/stateWorldActions.ts`
- Modify: `packages/client/src/game/stateWorldBoss.ts`
- Modify: `packages/client/src/game/stateCombatEncounterSync.ts`
- Modify: `packages/client/src/game/worldTileResolutionPayloads.ts`
- Modify: `packages/client/src/app/normalizeGameState.ts`
- Modify: `packages/client/src/app/normalizeShared.ts`
- Test: `packages/client/src/game/dungeons/worldState.test.ts`
- Test: `packages/client/src/app/normalize.test.ts`

- [ ] **Step 1: Write the failing world-registry and normalization tests**

Create `packages/client/src/game/dungeons/worldState.test.ts` with these cases:

```ts
import { describe, expect, it } from 'vitest';
import { createGame } from '../stateFactory';
import {
  createDungeonWorldState,
  getActiveWorld,
  setActiveWorld,
  syncActiveWorldAliases,
  SURFACE_WORLD_ID,
} from './worldState';

describe('worldState', () => {
  it('keeps top-level tiles and enemies aliased to the active world only', () => {
    const game = createGame(3, 'dungeon-world-alias');
    const dungeonId = 'dungeon:dungeon-world-alias:1,0';
    const dungeonWorld = createDungeonWorldState({
      id: dungeonId,
      tiles: {
        '0,0': {
          coord: { q: 0, r: 0 },
          terrain: 'dungeon-brick-floor',
          structure: 'dungeon',
          items: [],
          enemyIds: [],
        },
      },
      enemies: {},
      dungeon: {
        cleared: false,
        entranceCoord: { q: 0, r: 0 },
        finalChestCoord: { q: 4, r: 0 },
        finalEliteEnemyId: 'enemy-4,0-0',
        paddingRadius: 6,
        surfaceEntranceCoord: { q: 1, r: 0 },
        templateId: 'rooms-and-corridors',
        themeId: 'brick-halls',
      },
    });

    game.worlds[dungeonId] = dungeonWorld;
    setActiveWorld(game, dungeonId);

    expect(getActiveWorld(game).id).toBe(dungeonId);
    expect(game.tiles['0,0']?.terrain).toBe('dungeon-brick-floor');
    expect(game.worlds[SURFACE_WORLD_ID]?.tiles['0,0']?.terrain).toBe('plains');
  });

  it('hydrates active-world aliases after restoring a dungeon-backed game', () => {
    const game = createGame(3, 'dungeon-world-restore');
    const dungeonId = 'dungeon:dungeon-world-restore:2,-1';
    game.activeWorldId = dungeonId;
    game.worlds[dungeonId] = createDungeonWorldState({
      id: dungeonId,
      tiles: {
        '0,0': {
          coord: { q: 0, r: 0 },
          terrain: 'dungeon-mud-floor',
          structure: 'dungeon',
          items: [],
          enemyIds: [],
        },
      },
      enemies: {},
      dungeon: {
        cleared: false,
        entranceCoord: { q: 0, r: 0 },
        finalChestCoord: { q: 6, r: -1 },
        finalEliteEnemyId: 'enemy-6,-1-0',
        paddingRadius: 6,
        surfaceEntranceCoord: { q: 2, r: -1 },
        templateId: 'branching-spine',
        themeId: 'mud-catacombs',
      },
    });

    syncActiveWorldAliases(game);

    expect(game.tiles['0,0']?.terrain).toBe('dungeon-mud-floor');
    expect(game.enemies).toBe(game.worlds[dungeonId]?.enemies);
  });
});
```

Add this case to `packages/client/src/app/normalize.test.ts`:

```ts
it('normalizes dungeon world registries and the dungeon chest structure', () => {
  const normalized = normalizeLoadedGame({
    seed: 'normalize-dungeon-world',
    radius: 3,
    surfaceWorldId: 'surface',
    activeWorldId: 'dungeon:normalize-dungeon-world:1,0',
    worlds: {
      surface: {
        id: 'surface',
        kind: 'surface',
        tiles: {},
        enemies: {},
      },
      'dungeon:normalize-dungeon-world:1,0': {
        id: 'dungeon:normalize-dungeon-world:1,0',
        kind: 'dungeon',
        tiles: {
          '0,0': {
            coord: { q: 0, r: 0 },
            terrain: 'dungeon-obsidian-floor',
            structure: 'dungeon-chest',
            items: [],
            enemyIds: [],
          },
        },
        enemies: {},
        dungeon: {
          cleared: false,
          entranceCoord: { q: 0, r: 0 },
          finalChestCoord: { q: 0, r: 0 },
          finalEliteEnemyId: 'enemy-0,1-0',
          paddingRadius: 6,
          surfaceEntranceCoord: { q: 1, r: 0 },
          templateId: 'dense-maze',
          themeId: 'obsidian-vault',
        },
      },
    },
    dungeonEntrances: {
      '1,0': {
        dungeonId: 'dungeon:normalize-dungeon-world:1,0',
        surfaceCoord: { q: 1, r: 0 },
      },
    },
    activeDungeon: {
      dungeonId: 'dungeon:normalize-dungeon-world:1,0',
      returnCoord: { q: 1, r: 0 },
      surfaceCoord: { q: 1, r: 0 },
    },
  });

  expect(normalized?.activeWorldId).toBe('dungeon:normalize-dungeon-world:1,0');
  expect(normalized?.tiles['0,0']?.structure).toBe('dungeon-chest');
});
```

- [ ] **Step 2: Run the world-registry tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/dungeons/worldState.test.ts src/app/normalize.test.ts
```

Expected: FAIL because the world-registry helpers, expanded `GameState` shape, and `dungeon-chest` structure do not exist yet.

- [ ] **Step 3: Add the world registry, alias syncing, and active-world tile builder**

Create `packages/client/src/game/dungeons/types.ts`:

```ts
import type { HexCoord } from '../hex';
import type { Enemy, Tile } from '../types';

export const SURFACE_WORLD_ID = 'surface' as const;

export type WorldKind = 'surface' | 'dungeon';
export type DungeonTemplateId =
  | 'rooms-and-corridors'
  | 'branching-spine'
  | 'dense-maze';
export type DungeonThemeId = 'brick-halls' | 'mud-catacombs' | 'obsidian-vault';

export interface GameWorldState {
  id: string;
  kind: WorldKind;
  tiles: Record<string, Tile>;
  enemies: Record<string, Enemy>;
}

export interface DungeonWorldMetadata {
  cleared: boolean;
  entranceCoord: HexCoord;
  finalChestCoord: HexCoord;
  finalEliteEnemyId: string;
  paddingRadius: number;
  surfaceEntranceCoord: HexCoord;
  templateId: DungeonTemplateId;
  themeId: DungeonThemeId;
}

export interface DungeonWorldState extends GameWorldState {
  kind: 'dungeon';
  dungeon: DungeonWorldMetadata;
}

export interface DungeonEntranceRecord {
  dungeonId: string;
  surfaceCoord: HexCoord;
}

export interface ActiveDungeonRun {
  dungeonId: string;
  returnCoord: HexCoord;
  surfaceCoord: HexCoord;
}
```

Update `packages/client/src/game/types.ts`:

```ts
export const TERRAINS = [
  'plains',
  'meadow',
  'steppe',
  'grove',
  'forest',
  'marsh',
  'rift',
  'blasted',
  'highlands',
  'mountain',
  'dunes',
  'badlands',
  'desert',
  'swamp',
  'dungeon-brick-floor',
  'dungeon-brick-cracked',
  'dungeon-brick-moss',
  'dungeon-brick-wall',
  'dungeon-mud-floor',
  'dungeon-mud-rut',
  'dungeon-mud-puddle',
  'dungeon-mud-wall',
  'dungeon-obsidian-floor',
  'dungeon-obsidian-ash',
  'dungeon-obsidian-ember',
  'dungeon-obsidian-wall',
] as const;

export const STRUCTURE_TYPES = [
  'forge',
  'rune-forge',
  'camp',
  'furnace',
  'mana-font',
  'workshop',
  'town',
  'corruption-altar',
  'dungeon',
  'dungeon-chest',
  'locked-chest',
  ...GATHERING_STRUCTURE_TYPES,
] as const;
```

Extend `GameState` in `packages/client/src/game/types.ts`:

```ts
import type {
  ActiveDungeonRun,
  DungeonEntranceRecord,
  GameWorldState,
} from './dungeons/types';

export interface GameState {
  seed: string;
  radius: number;
  surfaceWorldId: string;
  activeWorldId: string;
  worlds: Record<string, GameWorldState>;
  dungeonEntrances: Record<string, DungeonEntranceRecord>;
  activeDungeon: ActiveDungeonRun | null;
  homeHex: HexCoord;
  turn: number;
  worldTimeMs: number;
  dayPhase: 'day' | 'night';
  bloodMoonActive: boolean;
  bloodMoonCheckedTonight: boolean;
  bloodMoonCycle: number;
  harvestMoonActive: boolean;
  harvestMoonCheckedTonight: boolean;
  harvestMoonCycle: number;
  lastEarthshakeDay: number;
  gameOver: boolean;
  playerLevelUpVisualEndsAt?: number;
  logSequence: number;
  logs: LogEntry[];
  tiles: Record<string, Tile>;
  enemies: Record<string, Enemy>;
  player: Player;
  combat: CombatState | null;
}
```

Create `packages/client/src/game/dungeons/worldState.ts`:

```ts
import { hexDistance, hexKey, type HexCoord } from '../hex';
import type { Enemy, GameState, Tile } from '../types';
import {
  SURFACE_WORLD_ID,
  type DungeonWorldState,
  type GameWorldState,
} from './types';

export { SURFACE_WORLD_ID } from './types';

export function createSurfaceWorldState(): GameWorldState {
  return {
    id: SURFACE_WORLD_ID,
    kind: 'surface',
    tiles: {},
    enemies: {},
  };
}

export function createDungeonWorldState(
  world: Omit<DungeonWorldState, 'kind'>,
): DungeonWorldState {
  return { ...world, kind: 'dungeon' };
}

export function getActiveWorld(
  state: Pick<GameState, 'activeWorldId' | 'worlds'>,
) {
  return state.worlds[state.activeWorldId] ?? state.worlds[SURFACE_WORLD_ID]!;
}

export function getSurfaceWorld(state: Pick<GameState, 'worlds'>) {
  return state.worlds[SURFACE_WORLD_ID]!;
}

export function syncActiveWorldAliases(
  state: Pick<GameState, 'activeWorldId' | 'worlds' | 'tiles' | 'enemies'> & {
    tiles: Record<string, Tile>;
    enemies: Record<string, Enemy>;
  },
) {
  const activeWorld = getActiveWorld(state);
  state.tiles = activeWorld.tiles;
  state.enemies = activeWorld.enemies;
  return state;
}

export function setActiveWorld(
  state: Pick<GameState, 'activeWorldId' | 'worlds' | 'tiles' | 'enemies'>,
  worldId: string,
) {
  state.activeWorldId = worldId;
  syncActiveWorldAliases(state);
}

export function getEnemySpawnStructure(
  state: Pick<GameState, 'activeWorldId' | 'worlds'>,
  tile: Pick<Tile, 'structure'>,
) {
  return getActiveWorld(state).kind === 'dungeon' ? 'dungeon' : tile.structure;
}

export function buildDungeonFallbackTile(
  world: DungeonWorldState,
  coord: HexCoord,
): Tile {
  const maxKnownDistance = Math.max(
    ...Object.values(world.tiles).map((tile) =>
      hexDistance(tile.coord, world.dungeon.entranceCoord),
    ),
  );
  const wallTerrain = {
    'brick-halls': 'dungeon-brick-wall',
    'mud-catacombs': 'dungeon-mud-wall',
    'obsidian-vault': 'dungeon-obsidian-wall',
  }[world.dungeon.themeId] as Tile['terrain'];

  if (
    hexDistance(coord, world.dungeon.entranceCoord) >
    maxKnownDistance + world.dungeon.paddingRadius
  ) {
    return {
      coord,
      terrain: wallTerrain,
      items: [],
      enemyIds: [],
    };
  }

  return {
    coord,
    terrain: wallTerrain,
    items: [],
    enemyIds: [],
  };
}
```

Update `packages/client/src/game/stateFactory.ts`, `stateClone.ts`, and `stateMutationHelpers.ts` so the surface world is canonical and aliases stay synced:

```ts
const surfaceWorld = createSurfaceWorldState();
const state: GameState = {
  seed,
  radius,
  surfaceWorldId: SURFACE_WORLD_ID,
  activeWorldId: SURFACE_WORLD_ID,
  worlds: {
    [SURFACE_WORLD_ID]: surfaceWorld,
  },
  dungeonEntrances: {},
  activeDungeon: null,
  homeHex: { q: 0, r: 0 },
  turn: 0,
  worldTimeMs: 0,
  dayPhase: 'night',
  bloodMoonActive: false,
  bloodMoonCheckedTonight: false,
  bloodMoonCycle: 0,
  harvestMoonActive: false,
  harvestMoonCheckedTonight: false,
  harvestMoonCycle: 0,
  lastEarthshakeDay: -1,
  gameOver: false,
  playerLevelUpVisualEndsAt: 0,
  logSequence: 3,
  logs: createFreshLogsAtTime(seed, 0),
  tiles: surfaceWorld.tiles,
  enemies: surfaceWorld.enemies,
  combat: null,
  player: { ...player },
};
```

```ts
function copyWorlds(worlds: GameState['worlds']): GameState['worlds'] {
  return Object.fromEntries(
    Object.entries(worlds).map(([worldId, world]) => [
      worldId,
      {
        ...world,
        tiles: copyTiles(world.tiles),
        enemies: copyEnemies(world.enemies),
        ...(world.kind !== 'dungeon'
          ? {}
          : {
              dungeon: {
                ...world.dungeon,
                entranceCoord: { ...world.dungeon.entranceCoord },
                finalChestCoord: { ...world.dungeon.finalChestCoord },
                surfaceEntranceCoord: { ...world.dungeon.surfaceEntranceCoord },
              },
            }),
      },
    ]),
  );
}

export function copyGameState(
  state: GameState,
  slices: CopyStateSlices = {},
): GameState {
  const worlds =
    slices.tiles || slices.enemies ? copyWorlds(state.worlds) : state.worlds;
  const next = {
    ...state,
    worlds,
    dungeonEntrances: Object.fromEntries(
      Object.entries(state.dungeonEntrances).map(([key, value]) => [
        key,
        { ...value, surfaceCoord: { ...value.surfaceCoord } },
      ]),
    ),
    activeDungeon: state.activeDungeon
      ? {
          ...state.activeDungeon,
          returnCoord: { ...state.activeDungeon.returnCoord },
          surfaceCoord: { ...state.activeDungeon.surfaceCoord },
        }
      : null,
    homeHex: slices.homeHex ? { ...state.homeHex } : state.homeHex,
    logs: slices.logs ? [...state.logs] : state.logs,
    combat: slices.combat
      ? copyCombatState(state.combat, state.worldTimeMs)
      : state.combat,
    player: slices.player ? copyPlayer(state.player) : state.player,
    tiles: state.tiles,
    enemies: state.enemies,
  };

  return syncActiveWorldAliases(next);
}
```

Update `packages/client/src/game/world.ts`, `stateWorldQueries.ts`, and the direct `buildTile` callers so dungeon lookups never synthesize surface tiles:

```ts
import {
  buildDungeonFallbackTile,
  getActiveWorld,
  getEnemySpawnStructure,
} from './dungeons/worldState';

export function buildSurfaceTile(seed: string, coord: HexCoord): Tile {
  if (coord.q === 0 && coord.r === 0) {
    return {
      coord,
      terrain: 'plains',
      structure: undefined,
      items: [],
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: [],
    };
  }

  const terrain = pickTerrain(seed, coord);
  const worldBossCenter = findSpawnedWorldBossCenter(seed, coord);
  if (worldBossCenter) {
    const isBossCenter =
      worldBossCenter.q === coord.q && worldBossCenter.r === coord.r;
    return {
      coord,
      terrain,
      structure: undefined,
      items: [],
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: isBossCenter ? [worldBossEnemyId(coord)] : [],
    };
  }

  return buildRegularTile(seed, coord, terrain);
}

export function buildTileForState(
  state: Pick<GameState, 'seed' | 'activeWorldId' | 'worlds'>,
  coord: HexCoord,
) {
  const world = getActiveWorld(state);
  if (world.kind === 'dungeon') {
    return world.tiles[hexKey(coord)] ?? buildDungeonFallbackTile(world, coord);
  }

  return buildSurfaceTile(state.seed, coord);
}

export function ensureTileState(state: GameState, coord: HexCoord) {
  const key = hexKey(coord);
  if (!state.tiles[key]) {
    state.tiles[key] = buildTileForState(state, coord);
  }

  const tile = state.tiles[key]!;
  tile.enemyIds.forEach((enemyId) => {
    if (!state.enemies[enemyId]) {
      state.enemies[enemyId] = makeEnemy(
        state.seed,
        coord,
        tile.terrain,
        enemyIndexFromId(enemyId),
        getEnemySpawnStructure(state, tile),
        state.bloodMoonActive,
        {
          enemyId,
          aggressive: !isFactionNpcEnemyId(enemyId),
          allowTreasureGoblinOverride: false,
          worldBoss: isWorldBossEnemyId(enemyId),
        },
      );
    }
  });
}

export function normalizeStructureState(tile: Tile): Tile {
  if (tile.structure === 'dungeon' || tile.structure === 'dungeon-chest') {
    return tile;
  }
  if (isGatheringStructure(tile.structure) && (tile.structureHp ?? 0) <= 0) {
    return {
      ...tile,
      structure: undefined,
      structureHp: undefined,
      structureMaxHp: undefined,
    };
  }
  return tile;
}
```

Update normalization in `packages/client/src/app/normalizeGameState.ts` and `normalizeShared.ts` so `worlds`, `dungeonEntrances`, `activeDungeon`, and `dungeon-chest` normalize and then call `syncActiveWorldAliases` before returning.

- [ ] **Step 4: Run the world-registry tests and verify they pass**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/dungeons/worldState.test.ts src/app/normalize.test.ts
```

Expected: PASS with the active-world alias tests and the new normalization case green.

- [ ] **Step 5: Commit the runtime scaffolding**

Run:

```bash
git add packages/client/src/game/dungeons/types.ts packages/client/src/game/dungeons/worldState.ts packages/client/src/game/dungeons/worldState.test.ts packages/client/src/game/types.ts packages/client/src/game/stateTypes.ts packages/client/src/game/stateFactory.ts packages/client/src/game/stateClone.ts packages/client/src/game/stateMutationHelpers.ts packages/client/src/game/world.ts packages/client/src/game/stateWorldQueries.ts packages/client/src/game/stateWorldActions.ts packages/client/src/game/stateWorldBoss.ts packages/client/src/game/stateCombatEncounterSync.ts packages/client/src/game/worldTileResolutionPayloads.ts packages/client/src/app/normalizeGameState.ts packages/client/src/app/normalizeShared.ts packages/client/src/app/normalize.test.ts
git commit -m "feat: add active world registry for dungeon instances"
```

### Task 2: Generate Themed Dungeon Worlds And Register Dungeon Chest Content

**Files:**

- Create: `packages/client/src/game/dungeons/generation/dungeonThemes.ts`
- Create: `packages/client/src/game/dungeons/generation/dungeonTemplates.ts`
- Create: `packages/client/src/game/dungeons/generation/generateDungeonWorld.ts`
- Create: `packages/client/src/game/dungeons/generation/generateDungeonWorld.test.ts`
- Create: `packages/client/scripts/generate-dungeon-terrain-variants.mjs`
- Create: `packages/client/src/assets/images/terrain/dungeons/`
- Modify: `packages/client/src/game/worldTerrain.ts`
- Modify: `packages/client/src/game/content/structures/structureCatalog.ts`
- Create: `packages/client/src/game/content/structures/dungeonChest.ts`
- Modify: `packages/client/src/game/content/structures/index.test.ts`
- Modify: `packages/client/scripts/world-terrain-atlas.config.mjs`
- Modify: `packages/client/src/assets/generated/world-terrain-atlas.json`
- Modify: `packages/client/src/assets/generated/world-terrain-atlas.png`
- Modify: `packages/client/src/i18n/locales/en.json`
- Test: `packages/client/src/game/dungeons/generation/generateDungeonWorld.test.ts`
- Test: `packages/client/src/game/content/structures/index.test.ts`

- [ ] **Step 1: Write the failing dungeon generator and structure-config tests**

Create `packages/client/src/game/dungeons/generation/generateDungeonWorld.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isPassableTerrain } from '../../worldTerrain';
import { generateDungeonWorld } from './generateDungeonWorld';

describe('generateDungeonWorld', () => {
  it('builds a deterministic padded dungeon with 200+ passable tiles and a final chest', () => {
    const world = generateDungeonWorld({
      dungeonId: 'dungeon:generator:1,0',
      gameRadius: 6,
      seed: 'generator-seed',
      surfaceCoord: { q: 1, r: 0 },
    });

    const passableTiles = Object.values(world.tiles).filter((tile) =>
      isPassableTerrain(tile.terrain),
    );
    const chestTile = Object.values(world.tiles).find(
      (tile) => tile.structure === 'dungeon-chest',
    );

    expect(passableTiles.length).toBeGreaterThanOrEqual(200);
    expect(world.tiles['0,0']?.structure).toBe('dungeon');
    expect(world.enemies[world.dungeon.finalEliteEnemyId]?.elite).toBe(true);
    expect(chestTile?.coord).toEqual(world.dungeon.finalChestCoord);
  });

  it('uses wall terrain from the selected theme around the playable footprint', () => {
    const world = generateDungeonWorld({
      dungeonId: 'dungeon:generator:2,-1',
      gameRadius: 6,
      seed: 'generator-wall-seed',
      surfaceCoord: { q: 2, r: -1 },
    });

    const wallTiles = Object.values(world.tiles).filter((tile) =>
      tile.terrain.endsWith('-wall'),
    );

    expect(wallTiles.length).toBeGreaterThan(0);
    expect(
      wallTiles.every((tile) => isPassableTerrain(tile.terrain) === false),
    ).toBe(true);
  });
});
```

Add this case to `packages/client/src/game/content/structures/index.test.ts`:

```ts
it('registers the dungeon chest as utility loot content with localized text', () => {
  const config = getStructureConfig('dungeon-chest');
  expect(config.icon).toBe(ContentIcons.LockedChest);
  expect(config.functionsProvided).toContain('loot');
  expect(config.title).toBe('Dungeon Chest');
});
```

- [ ] **Step 2: Run the generator tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/dungeons/generation/generateDungeonWorld.test.ts src/game/content/structures/index.test.ts
```

Expected: FAIL because the generator files, dungeon terrain ids, and `dungeon-chest` config are missing.

- [ ] **Step 3: Add theme catalogs, layout families, generated terrain assets, and the dungeon chest**

Create `packages/client/src/game/dungeons/generation/dungeonThemes.ts`:

```ts
import type { DungeonThemeId } from '../types';
import type { Terrain } from '../../types';

export interface DungeonThemeDefinition {
  id: DungeonThemeId;
  wall: Terrain;
  floors: [Terrain, Terrain, Terrain];
}

export const DUNGEON_THEME_CATALOG: Record<
  DungeonThemeId,
  DungeonThemeDefinition
> = {
  'brick-halls': {
    id: 'brick-halls',
    wall: 'dungeon-brick-wall',
    floors: [
      'dungeon-brick-floor',
      'dungeon-brick-cracked',
      'dungeon-brick-moss',
    ],
  },
  'mud-catacombs': {
    id: 'mud-catacombs',
    wall: 'dungeon-mud-wall',
    floors: ['dungeon-mud-floor', 'dungeon-mud-rut', 'dungeon-mud-puddle'],
  },
  'obsidian-vault': {
    id: 'obsidian-vault',
    wall: 'dungeon-obsidian-wall',
    floors: [
      'dungeon-obsidian-floor',
      'dungeon-obsidian-ash',
      'dungeon-obsidian-ember',
    ],
  },
};
```

Create `packages/client/src/game/dungeons/generation/dungeonTemplates.ts`:

```ts
import { createRng } from '../../random';
import type { DungeonTemplateId } from '../types';

export const DUNGEON_TEMPLATE_WEIGHTS: Array<{
  id: DungeonTemplateId;
  weight: number;
}> = [
  { id: 'rooms-and-corridors', weight: 6 },
  { id: 'branching-spine', weight: 3 },
  { id: 'dense-maze', weight: 2 },
];

export function pickDungeonTemplateId(seed: string): DungeonTemplateId {
  const roll = createRng(`${seed}:dungeon-template`)();
  const total = DUNGEON_TEMPLATE_WEIGHTS.reduce(
    (sum, entry) => sum + entry.weight,
    0,
  );
  let threshold = roll * total;
  for (const entry of DUNGEON_TEMPLATE_WEIGHTS) {
    threshold -= entry.weight;
    if (threshold <= 0) {
      return entry.id;
    }
  }
  return 'rooms-and-corridors';
}
```

Create `packages/client/src/game/dungeons/generation/generateDungeonWorld.ts`:

```ts
import { enemyKey, makeEnemy } from '../../combat';
import { hexKey, type HexCoord } from '../../hex';
import { createRng } from '../../random';
import type { Tile } from '../../types';
import { createDungeonWorldState } from '../worldState';
import type { DungeonThemeId, DungeonWorldState } from '../types';
import { DUNGEON_THEME_CATALOG } from './dungeonThemes';
import { pickDungeonTemplateId } from './dungeonTemplates';

const MIN_PASSABLE_TILES = 200;

export function generateDungeonWorld({
  dungeonId,
  gameRadius,
  seed,
  surfaceCoord,
}: {
  dungeonId: string;
  gameRadius: number;
  seed: string;
  surfaceCoord: HexCoord;
}): DungeonWorldState {
  const templateId = pickDungeonTemplateId(`${seed}:${dungeonId}`);
  const themeId = pickDungeonThemeId(`${seed}:${dungeonId}`);
  const theme = DUNGEON_THEME_CATALOG[themeId];
  const layout = buildLayout(templateId, `${seed}:${dungeonId}`);
  const paddedTiles = buildPaddedDungeonTiles(
    layout.passable,
    theme,
    gameRadius,
  );
  const entranceCoord = { q: 0, r: 0 };
  const finalChestCoord = layout.finalChestCoord;
  const eliteCoord = layout.finalEliteCoord;
  const finalEliteEnemyId = enemyKey(eliteCoord, 0);

  paddedTiles[hexKey(entranceCoord)] = {
    coord: entranceCoord,
    terrain: theme.floors[0],
    structure: 'dungeon',
    items: [],
    enemyIds: [],
  };
  paddedTiles[hexKey(finalChestCoord)] = {
    coord: finalChestCoord,
    terrain: theme.floors[1],
    structure: 'dungeon-chest',
    items: [],
    enemyIds: [],
  };

  const enemies = Object.fromEntries(
    layout.enemyCoords.map((coord, index) => {
      const enemy = makeEnemy(
        `${seed}:${dungeonId}`,
        coord,
        paddedTiles[hexKey(coord)]!.terrain,
        index,
        'dungeon',
        false,
      );
      paddedTiles[hexKey(coord)]!.enemyIds.push(enemy.id);
      return [enemy.id, enemy];
    }),
  );

  const finalElite = makeEnemy(
    `${seed}:${dungeonId}`,
    eliteCoord,
    paddedTiles[hexKey(eliteCoord)]!.terrain,
    0,
    'dungeon',
    false,
    {
      enemyId: finalEliteEnemyId,
      rarity: 'epic',
    },
  );
  finalElite.elite = true;
  paddedTiles[hexKey(eliteCoord)]!.enemyIds.push(finalEliteEnemyId);
  enemies[finalEliteEnemyId] = finalElite;

  return createDungeonWorldState({
    id: dungeonId,
    tiles: paddedTiles,
    enemies,
    dungeon: {
      cleared: false,
      entranceCoord,
      finalChestCoord,
      finalEliteEnemyId,
      paddingRadius: gameRadius,
      surfaceEntranceCoord: surfaceCoord,
      templateId,
      themeId,
    },
  });
}

function pickDungeonThemeId(seed: string): DungeonThemeId {
  const themeIds = Object.keys(DUNGEON_THEME_CATALOG) as DungeonThemeId[];
  return themeIds[Math.floor(createRng(`${seed}:theme`)() * themeIds.length)]!;
}

function buildLayout(templateId: string, seed: string) {
  switch (templateId) {
    case 'branching-spine':
      return buildBranchingSpine(seed);
    case 'dense-maze':
      return buildDenseMaze(seed);
    default:
      return buildRoomsAndCorridors(seed);
  }
}

function buildRoomsAndCorridors(seed: string) {
  const passable = carveRoomClusters(seed, 18);
  if (passable.length < MIN_PASSABLE_TILES) {
    throw new Error('Dungeon layout below minimum passable size.');
  }
  return {
    passable,
    enemyCoords: passable.slice(20, 34),
    finalChestCoord: passable[passable.length - 2]!,
    finalEliteCoord: passable[passable.length - 6]!,
  };
}
```

Create `packages/client/scripts/generate-dungeon-terrain-variants.mjs`:

```js
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const ROOT = process.cwd();
const TERRAIN_DIR = path.join(
  ROOT,
  'packages/client/src/assets/images/terrain/dungeons',
);

const VARIANTS = [
  {
    source: 'packages/client/src/assets/images/terrain/plains-v2.png',
    output: 'dungeon-brick-floor.png',
    tint: '#6f5a50',
    saturation: 0.55,
  },
  {
    source: 'packages/client/src/assets/images/terrain/highlands-v2.png',
    output: 'dungeon-brick-cracked.png',
    tint: '#7f6658',
    saturation: 0.5,
  },
  {
    source: 'packages/client/src/assets/images/terrain/forest-v2.png',
    output: 'dungeon-brick-moss.png',
    tint: '#556248',
    saturation: 0.48,
  },
  {
    source: 'packages/client/src/assets/images/terrain/mountain-v2.png',
    output: 'dungeon-brick-wall.png',
    tint: '#54463f',
    saturation: 0.4,
  },
  {
    source: 'packages/client/src/assets/images/terrain/marsh-v2.png',
    output: 'dungeon-mud-floor.png',
    tint: '#5b4b34',
    saturation: 0.62,
  },
  {
    source: 'packages/client/src/assets/images/terrain/swamp-v2.png',
    output: 'dungeon-mud-rut.png',
    tint: '#493823',
    saturation: 0.58,
  },
  {
    source: 'packages/client/src/assets/images/terrain/badlands-v2.png',
    output: 'dungeon-mud-puddle.png',
    tint: '#4f412e',
    saturation: 0.44,
  },
  {
    source: 'packages/client/src/assets/images/terrain/mountain-v2.png',
    output: 'dungeon-mud-wall.png',
    tint: '#392f24',
    saturation: 0.32,
  },
  {
    source: 'packages/client/src/assets/images/terrain/blasted-v2.png',
    output: 'dungeon-obsidian-floor.png',
    tint: '#33283f',
    saturation: 0.54,
  },
  {
    source: 'packages/client/src/assets/images/terrain/rift-v2.png',
    output: 'dungeon-obsidian-ash.png',
    tint: '#44374e',
    saturation: 0.38,
  },
  {
    source: 'packages/client/src/assets/images/terrain/highlands-v2.png',
    output: 'dungeon-obsidian-ember.png',
    tint: '#5d465e',
    saturation: 0.46,
  },
  {
    source: 'packages/client/src/assets/images/terrain/mountain-v2.png',
    output: 'dungeon-obsidian-wall.png',
    tint: '#251f31',
    saturation: 0.3,
  },
];

await mkdir(TERRAIN_DIR, { recursive: true });

for (const variant of VARIANTS) {
  await sharp(path.join(ROOT, variant.source))
    .modulate({ saturation: variant.saturation })
    .tint(variant.tint)
    .png()
    .toFile(path.join(TERRAIN_DIR, variant.output));
}
```

Update `packages/client/src/game/worldTerrain.ts`:

```ts
interface TerrainProfile {
  biome:
    | 'grassland'
    | 'woodland'
    | 'wetland'
    | 'arid'
    | 'alpine'
    | 'corrupted'
    | 'dungeon';
  passable: boolean;
  tierBonus: number;
  contentTerrain: Terrain;
  worldBossEligible: boolean;
}

const TERRAIN_PROFILES = {
  plains: {
    biome: 'grassland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'plains',
    worldBossEligible: false,
  },
  meadow: {
    biome: 'grassland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'plains',
    worldBossEligible: false,
  },
  steppe: {
    biome: 'grassland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'plains',
    worldBossEligible: false,
  },
  grove: {
    biome: 'woodland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'forest',
    worldBossEligible: true,
  },
  forest: {
    biome: 'woodland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'forest',
    worldBossEligible: true,
  },
  marsh: {
    biome: 'wetland',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'swamp',
    worldBossEligible: false,
  },
  swamp: {
    biome: 'wetland',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'swamp',
    worldBossEligible: false,
  },
  dunes: {
    biome: 'arid',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'desert',
    worldBossEligible: false,
  },
  desert: {
    biome: 'arid',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'desert',
    worldBossEligible: false,
  },
  badlands: {
    biome: 'arid',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'desert',
    worldBossEligible: false,
  },
  highlands: {
    biome: 'alpine',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'plains',
    worldBossEligible: false,
  },
  mountain: {
    biome: 'alpine',
    passable: false,
    tierBonus: 2,
    contentTerrain: 'mountain',
    worldBossEligible: false,
  },
  blasted: {
    biome: 'corrupted',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'desert',
    worldBossEligible: false,
  },
  rift: {
    biome: 'corrupted',
    passable: false,
    tierBonus: 2,
    contentTerrain: 'rift',
    worldBossEligible: false,
  },
  'dungeon-brick-floor': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-brick-floor',
    worldBossEligible: false,
  },
  'dungeon-brick-cracked': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-brick-cracked',
    worldBossEligible: false,
  },
  'dungeon-brick-moss': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-brick-moss',
    worldBossEligible: false,
  },
  'dungeon-brick-wall': {
    biome: 'dungeon',
    passable: false,
    tierBonus: 2,
    contentTerrain: 'dungeon-brick-wall',
    worldBossEligible: false,
  },
  'dungeon-mud-floor': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-mud-floor',
    worldBossEligible: false,
  },
  'dungeon-mud-rut': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-mud-rut',
    worldBossEligible: false,
  },
  'dungeon-mud-puddle': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-mud-puddle',
    worldBossEligible: false,
  },
  'dungeon-mud-wall': {
    biome: 'dungeon',
    passable: false,
    tierBonus: 2,
    contentTerrain: 'dungeon-mud-wall',
    worldBossEligible: false,
  },
  'dungeon-obsidian-floor': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-obsidian-floor',
    worldBossEligible: false,
  },
  'dungeon-obsidian-ash': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-obsidian-ash',
    worldBossEligible: false,
  },
  'dungeon-obsidian-ember': {
    biome: 'dungeon',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'dungeon-obsidian-ember',
    worldBossEligible: false,
  },
  'dungeon-obsidian-wall': {
    biome: 'dungeon',
    passable: false,
    tierBonus: 2,
    contentTerrain: 'dungeon-obsidian-wall',
    worldBossEligible: false,
  },
} as const satisfies Record<Terrain, TerrainProfile>;
```

Create `packages/client/src/game/content/structures/dungeonChest.ts`:

```ts
import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildUtilityStructureTags } from './structureTagRules';

export const dungeonChestStructureConfig: StructureConfig = {
  type: 'dungeon-chest',
  title: structureTitle('dungeon-chest'),
  description: structureDescription('dungeon-chest'),
  icon: ContentIcons.LockedChest,
  tint: 0xfbbf24,
  functionsProvided: ['loot'],
  tags: buildUtilityStructureTags(
    GAME_TAGS.structure.chest,
    GAME_TAGS.structure.dungeon,
  ),
  globalAppearanceThreshold: 1,
};
```

Register it in `packages/client/src/game/content/structures/structureCatalog.ts`, add all dungeon terrain labels plus the new structure text to `packages/client/src/i18n/locales/en.json`, run the terrain-variant script, then add the generated files to `packages/client/scripts/world-terrain-atlas.config.mjs` and rebuild the atlas with `pnpm assets:world-atlas`.

- [ ] **Step 4: Run the generator and structure tests and verify they pass**

Run:

```bash
node packages/client/scripts/generate-dungeon-terrain-variants.mjs
pnpm assets:world-atlas
pnpm --filter @realmfall/client exec vitest run --project node src/game/dungeons/generation/generateDungeonWorld.test.ts src/game/content/structures/index.test.ts
```

Expected: PASS with the dungeon generator, wall padding, theme terrain, and `dungeon-chest` config tests green, and the atlas build updating `world-terrain-atlas.json` and `.png`.

- [ ] **Step 5: Commit the dungeon generator and content layer**

Run:

```bash
git add packages/client/src/game/dungeons/generation/dungeonThemes.ts packages/client/src/game/dungeons/generation/dungeonTemplates.ts packages/client/src/game/dungeons/generation/generateDungeonWorld.ts packages/client/src/game/dungeons/generation/generateDungeonWorld.test.ts packages/client/scripts/generate-dungeon-terrain-variants.mjs packages/client/src/assets/images/terrain/dungeons packages/client/src/game/worldTerrain.ts packages/client/src/game/content/structures/dungeonChest.ts packages/client/src/game/content/structures/structureCatalog.ts packages/client/src/game/content/structures/index.test.ts packages/client/scripts/world-terrain-atlas.config.mjs packages/client/src/assets/generated/world-terrain-atlas.json packages/client/src/assets/generated/world-terrain-atlas.png packages/client/src/i18n/locales/en.json
git commit -m "feat: add dungeon generation themes and templates"
```

### Task 3: Implement Dungeon Gameplay Flow, Chest Clear Rules, And Surface-Only World Events

**Files:**

- Create: `packages/client/src/game/stateDungeonActions.ts`
- Create: `packages/client/src/game/stateDungeonChest.ts`
- Create: `packages/client/src/game/stateDungeonActions.test.ts`
- Modify: `packages/client/src/game/stateWorldActions.ts`
- Modify: `packages/client/src/game/stateSurvival.ts`
- Modify: `packages/client/src/game/worldTileGeneration.ts`
- Modify: `packages/client/src/game/stateWorldEvents.ts`
- Modify: `packages/client/src/game/stateWorldEvents.test.ts`
- Modify: `packages/client/src/game/stateWorldClock.ts`
- Modify: `packages/client/src/game/stateRewards.ts`
- Modify: `packages/client/src/game/world.ts`
- Modify: `packages/client/src/game/state.ts`
- Modify: `packages/client/src/game/stateSelectors.ts`
- Test: `packages/client/src/game/stateDungeonActions.test.ts`
- Test: `packages/client/src/game/stateWorldEvents.test.ts`

- [ ] **Step 1: Write the failing gameplay tests for dungeon flow**

Create `packages/client/src/game/stateDungeonActions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createGame } from './stateFactory';
import { generateDungeonWorld } from './dungeons/generation/generateDungeonWorld';
import type { DungeonWorldState } from './dungeons/types';
import {
  activateDungeonWorld,
  leaveDungeonWorld,
  markDungeonEliteDefeated,
  registerDungeonEntrance,
} from './stateDungeonActions';
import { openDungeonChest } from './stateDungeonChest';
import { respawnAtNearestTown } from './stateSurvival';

describe('stateDungeonActions', () => {
  it('enters and leaves the same persistent dungeon instance', () => {
    const game = createGame(3, 'enter-leave-dungeon');
    const surfaceCoord = { q: 2, r: 0 };
    const dungeonId = registerDungeonEntrance(game, surfaceCoord);
    const dungeonWorld = generateDungeonWorld({
      dungeonId,
      gameRadius: game.radius,
      seed: game.seed,
      surfaceCoord,
    });

    const entered = activateDungeonWorld(game, {
      dungeonId,
      dungeonWorld,
      returnCoord: surfaceCoord,
    });
    const left = leaveDungeonWorld(entered);

    expect(entered.activeWorldId).toBe(dungeonId);
    expect(entered.player.coord).toEqual({ q: 0, r: 0 });
    expect(left.activeWorldId).toBe('surface');
    expect(left.player.coord).toEqual(surfaceCoord);
  });

  it('keeps dungeon progress after a death and respawns on the surface', () => {
    const game = createGame(3, 'death-preserves-dungeon');
    const surfaceCoord = { q: 1, r: 1 };
    const dungeonId = registerDungeonEntrance(game, surfaceCoord);
    const dungeonWorld = generateDungeonWorld({
      dungeonId,
      gameRadius: game.radius,
      seed: game.seed,
      surfaceCoord,
    });
    const entered = activateDungeonWorld(game, {
      dungeonId,
      dungeonWorld,
      returnCoord: surfaceCoord,
    });

    entered.player.hp = 0;
    respawnAtNearestTown(entered, entered.player.coord);

    expect(entered.activeWorldId).toBe('surface');
    expect(entered.player.coord).toEqual(entered.homeHex);
    expect(entered.worlds[dungeonId]?.kind).toBe('dungeon');
  });

  it('requires the final elite before the dungeon chest can clear the instance', () => {
    const game = createGame(3, 'dungeon-clear-gating');
    const surfaceCoord = { q: 3, r: -1 };
    const dungeonId = registerDungeonEntrance(game, surfaceCoord);
    const dungeonWorld = generateDungeonWorld({
      dungeonId,
      gameRadius: game.radius,
      seed: game.seed,
      surfaceCoord,
    });
    const entered = activateDungeonWorld(game, {
      dungeonId,
      dungeonWorld,
      returnCoord: surfaceCoord,
    });
    const chestCoord = (entered.worlds[dungeonId] as DungeonWorldState).dungeon
      .finalChestCoord;
    entered.player.coord = { ...chestCoord };

    const blocked = openDungeonChest(entered);
    const unlocked = openDungeonChest(
      markDungeonEliteDefeated(entered, dungeonId),
    );

    expect(blocked.worlds[dungeonId]?.dungeon.cleared).toBe(false);
    expect(unlocked.worlds[dungeonId]?.dungeon.cleared).toBe(true);
  });

  it('re-enters a cleared dungeon as the same empty retired instance', () => {
    const game = createGame(3, 'dungeon-retired-reentry');
    const surfaceCoord = { q: 4, r: 0 };
    const dungeonId = registerDungeonEntrance(game, surfaceCoord);
    const dungeonWorld = generateDungeonWorld({
      dungeonId,
      gameRadius: game.radius,
      seed: game.seed,
      surfaceCoord,
    });
    const entered = activateDungeonWorld(game, {
      dungeonId,
      dungeonWorld,
      returnCoord: surfaceCoord,
    });
    const chestCoord = (entered.worlds[dungeonId] as DungeonWorldState).dungeon
      .finalChestCoord;
    entered.player.coord = { ...chestCoord };
    const cleared = openDungeonChest(
      markDungeonEliteDefeated(entered, dungeonId),
    );
    const retiredSurface = leaveDungeonWorld(cleared);
    const reentered = activateDungeonWorld(retiredSurface, {
      dungeonId,
      dungeonWorld: retiredSurface.worlds[dungeonId] as DungeonWorldState,
      returnCoord: surfaceCoord,
    });

    expect(reentered.worlds[dungeonId]?.dungeon.cleared).toBe(true);
    expect(
      Object.keys((reentered.worlds[dungeonId] as DungeonWorldState).enemies)
        .length,
    ).toBe(0);
  });
});
```

Replace the old disappearing-dungeon case in `packages/client/src/game/stateWorldEvents.test.ts` with:

```ts
it('keeps an emptied dungeon as a permanent entrance tile', () => {
  const game = createGame(3, 'dungeon-entrance-persists');
  const target = { q: 2, r: 0 };
  game.tiles['2,0'] = {
    coord: target,
    terrain: 'plains',
    structure: 'dungeon',
    items: [],
    enemyIds: [],
  };

  expect(normalizeStructureState(game.tiles['2,0']!)).toMatchObject({
    structure: 'dungeon',
    enemyIds: [],
  });
});
```

- [ ] **Step 2: Run the dungeon gameplay tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateDungeonActions.test.ts src/game/stateWorldEvents.test.ts
```

Expected: FAIL because the dungeon gameplay helpers do not exist, surface dungeon tiles still spawn enemies, and the old disappearing-dungeon rule is still active.

- [ ] **Step 3: Add enter or leave actions, chest gating, and surface-only event behavior**

Create `packages/client/src/game/stateDungeonActions.ts`:

```ts
import { hexKey, type HexCoord } from './hex';
import { addLog } from './logs';
import { cloneForWorldMutation } from './stateMutationHelpers';
import { t } from '../i18n';
import { setActiveWorld, SURFACE_WORLD_ID } from './dungeons/worldState';
import type { DungeonWorldState } from './dungeons/types';
import type { GameState } from './types';

export function registerDungeonEntrance(
  state: GameState,
  surfaceCoord: HexCoord,
) {
  const key = hexKey(surfaceCoord);
  const existing = state.dungeonEntrances[key];
  if (existing) {
    return existing.dungeonId;
  }

  const dungeonId = `dungeon:${state.seed}:${surfaceCoord.q},${surfaceCoord.r}`;
  state.dungeonEntrances[key] = {
    dungeonId,
    surfaceCoord: { ...surfaceCoord },
  };
  return dungeonId;
}

export function activateDungeonWorld(
  state: GameState,
  args: {
    dungeonId: string;
    dungeonWorld: DungeonWorldState;
    returnCoord: HexCoord;
  },
): GameState {
  const next = cloneForWorldMutation(state);
  next.worlds[args.dungeonId] = args.dungeonWorld;
  next.activeDungeon = {
    dungeonId: args.dungeonId,
    returnCoord: { ...args.returnCoord },
    surfaceCoord: { ...args.dungeonWorld.dungeon.surfaceEntranceCoord },
  };
  setActiveWorld(next, args.dungeonId);
  next.player.coord = { ...args.dungeonWorld.dungeon.entranceCoord };
  addLog(next, 'system', t('game.message.dungeon.enter'));
  return next;
}

export function leaveDungeonWorld(state: GameState): GameState {
  if (!state.activeDungeon) {
    return state;
  }

  const next = cloneForWorldMutation(state);
  const returnCoord = { ...next.activeDungeon.returnCoord };
  next.activeDungeon = null;
  setActiveWorld(next, SURFACE_WORLD_ID);
  next.player.coord = returnCoord;
  addLog(next, 'system', t('game.message.dungeon.leave'));
  return next;
}

export function markDungeonEliteDefeated(
  state: GameState,
  dungeonId: string,
): GameState {
  const next = cloneForWorldMutation(state);
  const world = next.worlds[dungeonId];
  if (!world || world.kind !== 'dungeon') {
    return state;
  }

  delete world.enemies[world.dungeon.finalEliteEnemyId];
  return next;
}

export function markDungeonCleared(
  state: GameState,
  dungeonId: string,
): GameState {
  const next = cloneForWorldMutation(state);
  const world = next.worlds[dungeonId];
  if (!world || world.kind !== 'dungeon') {
    return state;
  }

  world.dungeon.cleared = true;
  world.enemies = {};
  Object.values(world.tiles).forEach((tile) => {
    tile.enemyIds = [];
  });
  addLog(next, 'loot', t('game.message.dungeon.cleared'));
  return next;
}
```

Create `packages/client/src/game/stateDungeonChest.ts`:

```ts
import { addItemToInventory } from './inventory';
import { addLog } from './logs';
import { terrainTier } from './shared';
import { makeWorldGeneratedItem } from './worldGeneratedItems';
import { cloneForWorldMutation, message } from './stateMutationHelpers';
import { getCurrentTile } from './stateWorldQueries';
import { markDungeonCleared } from './stateDungeonActions';
import { t } from '../i18n';
import type { GameState } from './types';

export function openDungeonChest(state: GameState): GameState {
  const currentTile = getCurrentTile(state);
  if (currentTile.structure !== 'dungeon-chest') {
    return message(state, t('game.message.dungeon.chest.missing'));
  }
  if (!state.activeDungeon) {
    return message(state, t('game.message.dungeon.chest.surfaceBlocked'));
  }

  const activeWorld = state.worlds[state.activeDungeon.dungeonId];
  if (!activeWorld || activeWorld.kind !== 'dungeon') {
    return message(state, t('game.message.dungeon.chest.surfaceBlocked'));
  }
  if (activeWorld.enemies[activeWorld.dungeon.finalEliteEnemyId]) {
    return message(state, t('game.message.dungeon.chest.guardFirst'));
  }

  const next = cloneForWorldMutation(state);
  const loot = makeWorldGeneratedItem(
    `${next.seed}:${next.activeDungeon!.dungeonId}:final-chest`,
    next.player.coord,
    terrainTier(next.player.coord, currentTile.terrain) + 2,
    0.92,
  );
  addItemToInventory(next.player.inventory, loot);
  delete next.tiles[`${next.player.coord.q},${next.player.coord.r}`]!.structure;
  addLog(
    next,
    'loot',
    t('game.message.dungeon.chest.open', { item: loot.name }),
  );
  return markDungeonCleared(next, next.activeDungeon!.dungeonId);
}
```

Update `packages/client/src/game/stateWorldActions.ts`:

```ts
import { openDungeonChest } from './stateDungeonChest';

export function interactWithStructure(state: GameState): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const tile = getCurrentTile(state);
  if (tile.structure === 'dungeon-chest') {
    return openDungeonChest(state);
  }
  if (!isGatheringStructure(tile.structure)) {
    return message(state, t('game.message.gather.nothingHere'));
  }
  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const currentTile = next.tiles[key];
  if (!isGatheringStructure(currentTile.structure)) {
    return message(state, t('game.message.gather.nothingHere'));
  }
}
```

Update the surface spawn paths so dungeon entrances remain empty:

```ts
// packages/client/src/game/worldTileGeneration.ts
function buildEnemyIds(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
  structure?: StructureType,
  claim?: TileClaim,
  npcEnemyId = makeFactionNpcEnemyId(coord),
) {
  if (!isPassable(terrain)) return [];
  if (claim) return claim.npc ? [claim.npc.enemyId ?? npcEnemyId] : [];
  if (hexDistance(coord, { q: 0, r: 0 }) <= 1) return [];
  if (structure) return [];
  return shouldSpawnEnemy(seed, coord, terrain) ? [enemyKey(coord, 0)] : [];
}

// packages/client/src/game/stateWorldEvents.ts
const dungeonId = registerDungeonEntrance(state, coord);
state.tiles[key] = {
  ...tile,
  structure: 'dungeon',
  structureHp: undefined,
  structureMaxHp: undefined,
  enemyIds: [],
};
addLog(
  state,
  'system',
  t('game.message.earthshake.open', { q: coord.q, r: coord.r }),
);
addLog(state, 'system', t('game.message.dungeon.discovered', { dungeonId }));
```

Keep world events surface-only and dungeon loot bonuses tag-based:

```ts
// packages/client/src/game/stateWorldClock.ts
function syncSurfaceWorldBloodMoonState(state: GameState, active: boolean) {
  Object.values(state.worlds).forEach((world) => {
    if (world.kind === 'surface') {
      syncEnemyBloodMoonState(world.enemies, active);
    }
  });
}

if (next.activeWorldId === next.surfaceWorldId) {
  const spawnedCount = spawnBloodMoonEnemies(next);
  addLog(next, 'combat', t('game.message.bloodMoon.begin'));
  if (spawnedCount > 0) {
    addLog(
      next,
      'combat',
      t(
        spawnedCount === 1
          ? 'game.message.bloodMoon.foes.one'
          : 'game.message.bloodMoon.foes.other',
        { count: spawnedCount },
      ),
    );
  }
}

// packages/client/src/game/stateSurvival.ts
if (state.activeDungeon) {
  leaveDungeonWorld(state);
}
state.player.coord = { ...state.homeHex };

// packages/client/src/game/stateRewards.ts
const dungeonMultiplier = enemy.tags?.includes(GAME_TAGS.enemy.dungeon)
  ? ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER
  : 1;
```

Export the new helpers from `packages/client/src/game/state.ts` and `stateSelectors.ts`.

- [ ] **Step 4: Run the dungeon gameplay tests and verify they pass**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateDungeonActions.test.ts src/game/stateWorldEvents.test.ts
```

Expected: PASS with permanent entrances, no surface dungeon enemies, persistent enter or leave routing, dungeon-death recovery, and elite-gated chest clearing all green.

- [ ] **Step 5: Commit the gameplay flow**

Run:

```bash
git add packages/client/src/game/stateDungeonActions.ts packages/client/src/game/stateDungeonChest.ts packages/client/src/game/stateDungeonActions.test.ts packages/client/src/game/stateWorldActions.ts packages/client/src/game/stateSurvival.ts packages/client/src/game/worldTileGeneration.ts packages/client/src/game/stateWorldEvents.ts packages/client/src/game/stateWorldEvents.test.ts packages/client/src/game/stateWorldClock.ts packages/client/src/game/stateRewards.ts packages/client/src/game/world.ts packages/client/src/game/state.ts packages/client/src/game/stateSelectors.ts
git commit -m "feat: add dungeon gameplay flow and clear rules"
```

### Task 4: Persist Dungeon Bodies Under Dedicated Keys And Hydrate Them Safely

**Files:**

- Modify: `packages/client/src/persistence/storage.ts`
- Modify: `packages/client/src/persistence/storage.test.ts`
- Create: `packages/client/src/app/App/persistence/dungeonSaveSegments.ts`
- Modify: `packages/client/src/app/App/persistence/saveSegments.ts`
- Modify: `packages/client/src/app/App/persistence/saveScheduler.ts`
- Modify: `packages/client/src/app/App/useAppPersistence.ts`
- Modify: `packages/client/src/app/App/tests/useAppPersistence.test.tsx`
- Modify: `packages/client/src/app/App/tests/appTestHarness.tsx`
- Modify: `packages/client/src/app/App/hooks/useAppSettingsActions.ts`
- Test: `packages/client/src/persistence/storage.test.ts`
- Test: `packages/client/src/app/App/tests/useAppPersistence.test.tsx`

- [ ] **Step 1: Write the failing dedicated-dungeon persistence tests**

Add these cases to `packages/client/src/persistence/storage.test.ts`:

```ts
it('stores dungeon bodies under dedicated keys that include the dungeon id', async () => {
  const {
    getDungeonSaveStorageKey,
    loadEncryptedDungeonState,
    saveEncryptedDungeonState,
  } = await import('./storage');

  await saveEncryptedDungeonState('dungeon:storage-seed:1,0', {
    id: 'dungeon:storage-seed:1,0',
    kind: 'dungeon',
    tiles: {},
    enemies: {},
    dungeon: {
      cleared: false,
      entranceCoord: { q: 0, r: 0 },
      finalChestCoord: { q: 6, r: 0 },
      finalEliteEnemyId: 'enemy-6,0-0',
      paddingRadius: 6,
      surfaceEntranceCoord: { q: 1, r: 0 },
      templateId: 'rooms-and-corridors',
      themeId: 'brick-halls',
    },
  });

  expect(
    records.has(getDungeonSaveStorageKey('dungeon:storage-seed:1,0')),
  ).toBe(true);
  await expect(
    loadEncryptedDungeonState('dungeon:storage-seed:1,0'),
  ).resolves.toMatchObject({ id: 'dungeon:storage-seed:1,0' });
});

it('clears all dungeon keys when clearing the game save area', async () => {
  const {
    clearEncryptedDungeonStates,
    getDungeonSaveStorageKey,
    saveEncryptedDungeonState,
  } = await import('./storage');

  await saveEncryptedDungeonState('dungeon:storage-seed:2,-1', {
    id: 'dungeon:storage-seed:2,-1',
    kind: 'dungeon',
    tiles: {},
    enemies: {},
    dungeon: {
      cleared: false,
      entranceCoord: { q: 0, r: 0 },
      finalChestCoord: { q: 4, r: 0 },
      finalEliteEnemyId: 'enemy-4,0-0',
      paddingRadius: 6,
      surfaceEntranceCoord: { q: 2, r: -1 },
      templateId: 'dense-maze',
      themeId: 'obsidian-vault',
    },
  });

  await clearEncryptedDungeonStates();

  expect(
    records.has(getDungeonSaveStorageKey('dungeon:storage-seed:2,-1')),
  ).toBe(false);
});
```

Add this case to `packages/client/src/app/App/tests/useAppPersistence.test.tsx`:

```tsx
it('hydrates the active dungeon body from its dedicated save key', async () => {
  const savedGame = createGame(3, 'hydrate-dungeon-body');
  savedGame.activeWorldId = 'dungeon:hydrate-dungeon-body:1,0';
  savedGame.dungeonEntrances['1,0'] = {
    dungeonId: 'dungeon:hydrate-dungeon-body:1,0',
    surfaceCoord: { q: 1, r: 0 },
  };
  savedGame.activeDungeon = {
    dungeonId: 'dungeon:hydrate-dungeon-body:1,0',
    returnCoord: { q: 1, r: 0 },
    surfaceCoord: { q: 1, r: 0 },
  };

  loadEncryptedState.mockResolvedValue({ game: savedGame, ui: {} });
  loadEncryptedDungeonState.mockResolvedValue({
    id: 'dungeon:hydrate-dungeon-body:1,0',
    kind: 'dungeon',
    tiles: {
      '0,0': {
        coord: { q: 0, r: 0 },
        terrain: 'dungeon-brick-floor',
        structure: 'dungeon',
        items: [],
        enemyIds: [],
      },
    },
    enemies: {},
    dungeon: {
      cleared: false,
      entranceCoord: { q: 0, r: 0 },
      finalChestCoord: { q: 6, r: 0 },
      finalEliteEnemyId: 'enemy-6,0-0',
      paddingRadius: 6,
      surfaceEntranceCoord: { q: 1, r: 0 },
      templateId: 'rooms-and-corridors',
      themeId: 'brick-halls',
    },
  });

  const { host } = renderPersistenceHarness();
  await waitForHydration(host);

  expect(readHarnessGame().activeWorldId).toBe(
    'dungeon:hydrate-dungeon-body:1,0',
  );
  expect(readHarnessGame().tiles['0,0']?.terrain).toBe('dungeon-brick-floor');
});
```

- [ ] **Step 2: Run the persistence tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/persistence/storage.test.ts
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/useAppPersistence.test.tsx
```

Expected: FAIL because dedicated dungeon storage helpers are not exported, the app harness does not mock them, and hydration does not load dungeon bodies.

- [ ] **Step 3: Add dedicated dungeon storage APIs and separate dungeon autosave tracking**

Update `packages/client/src/persistence/storage.ts`:

```ts
const DUNGEON_STORAGE_KEY_PREFIX = 'game-state-dungeon-';

export function getDungeonSaveStorageKey(dungeonId: string) {
  return `${DUNGEON_STORAGE_KEY_PREFIX}${dungeonId}`;
}

export async function loadEncryptedDungeonState<T>(
  dungeonId: string,
): Promise<T | null> {
  const database = await openStorageDatabase();
  const payload = await loadPersistedPayloadByKey(
    getDungeonSaveStorageKey(dungeonId),
    database,
  );
  if (!payload) {
    return null;
  }

  try {
    return await decryptJson<T>(payload);
  } catch {
    return null;
  }
}

export async function saveEncryptedDungeonState(
  dungeonId: string,
  data: unknown,
) {
  const database = await openStorageDatabase();
  const payload = await encryptJson(data);
  await writePersistedPayloadByKey(
    getDungeonSaveStorageKey(dungeonId),
    payload,
    database,
  );
}

export async function clearEncryptedDungeonStates() {
  const database = await openStorageDatabase();
  await clearPersistedPayloadsByPrefix(DUNGEON_STORAGE_KEY_PREFIX, database);
}
```

Create `packages/client/src/app/App/persistence/dungeonSaveSegments.ts`:

```ts
import type { GameState } from '../../../game/stateTypes';
import type { DungeonWorldState } from '../../../game/dungeons/types';

export function buildPersistedDungeonWorlds(game: GameState) {
  return Object.fromEntries(
    Object.values(game.worlds)
      .filter((world): world is DungeonWorldState => world.kind === 'dungeon')
      .map((world) => [
        world.id,
        {
          ...world,
          enemies: world.enemies,
          tiles: world.tiles,
        },
      ]),
  );
}

export function serializePersistedDungeonWorlds(game: GameState) {
  return Object.fromEntries(
    Object.entries(buildPersistedDungeonWorlds(game)).map(
      ([dungeonId, world]) => [dungeonId, JSON.stringify(world)],
    ),
  );
}
```

Update `packages/client/src/app/App/persistence/saveSegments.ts` so the main game payload always stores the surface world under `worlds.surface` and keeps top-level `tiles` or `enemies` aligned with that surface world:

```ts
function buildPersistedGameSnapshot({
  game,
  worldTimeMs,
}: {
  game: GameState;
  worldTimeMs: number;
}) {
  const surfaceWorld = game.worlds[game.surfaceWorldId];
  return {
    ...game,
    worldTimeMs,
    logs: [],
    worlds: {
      [game.surfaceWorldId]: surfaceWorld,
    },
    tiles: surfaceWorld.tiles,
    enemies: surfaceWorld.enemies,
  };
}
```

Update `packages/client/src/app/App/persistence/saveScheduler.ts` to enqueue dirty dungeon ids separately:

```ts
import {
  saveEncryptedDungeonState,
  saveEncryptedState,
} from '../../../persistence/storage';

export async function enqueuePersistSnapshot({
  dirtySegmentsRef,
  latestInputsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
  dirtyDungeonIds,
  dungeonSnapshots,
  lastSavedDungeonSerializedRef,
  serialized,
  snapshot,
  savedDirtySegments,
}: {
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  latestInputsRef: MutableRefObject<LatestSaveInputs>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
  dirtyDungeonIds: string[];
  dungeonSnapshots: Record<string, unknown>;
  lastSavedDungeonSerializedRef: MutableRefObject<Record<string, string>>;
  serialized: SerializedSaveSegments;
  snapshot: PersistedData;
  savedDirtySegments: DirtySaveSegments;
}) {
  const queuedSave = saveQueueRef.current.then(async () => {
    saveInFlightRef.current = true;

    try {
      await saveEncryptedState(snapshot);
      await Promise.all(
        dirtyDungeonIds.map((dungeonId) =>
          saveEncryptedDungeonState(dungeonId, dungeonSnapshots[dungeonId]),
        ),
      );
      lastSavedSerializedRef.current = mergeSavedSerializedSegments(
        lastSavedSerializedRef.current,
        serialized,
        savedDirtySegments,
      );
      lastSavedDungeonSerializedRef.current = {
        ...lastSavedDungeonSerializedRef.current,
        ...Object.fromEntries(
          dirtyDungeonIds.map((dungeonId) => [
            dungeonId,
            JSON.stringify(dungeonSnapshots[dungeonId]),
          ]),
        ),
      };
      return { succeeded: true } satisfies PersistSnapshotResult;
    } catch (error) {
      return { error, succeeded: false } satisfies PersistSnapshotResult;
    } finally {
      const pendingDirtySegments = { ...dirtySegmentsRef.current };
      dirtySegmentsRef.current = getDirtySegments(
        serializeSegments(
          buildPersistedSegments(latestInputsRef.current, pendingDirtySegments),
        ),
        lastSavedSerializedRef.current,
        pendingDirtySegments,
      );
    }
  });

  saveQueueRef.current = queuedSave.then(() => undefined);
  return queuedSave;
}
```

Update `packages/client/src/app/App/useAppPersistence.ts` to hydrate and persist dungeon bodies:

```ts
const lastSavedDungeonSerializedRef = useRef<Record<string, string>>({});

void loadEncryptedState().then(async (saved) => {
  if (!alive) return;

  if (saved?.game) {
    const loadedGame = normalizeLoadedGame(saved.game);
    if (loadedGame) {
      if (
        loadedGame.activeDungeon &&
        loadedGame.activeWorldId !== loadedGame.surfaceWorldId
      ) {
        const dungeonWorld = await loadEncryptedDungeonState(
          loadedGame.activeDungeon.dungeonId,
        );
        if (dungeonWorld) {
          loadedGame.worlds[dungeonWorld.id] = dungeonWorld;
        } else {
          const fallbackSurfaceCoord = {
            ...loadedGame.activeDungeon.surfaceCoord,
          };
          loadedGame.activeDungeon = null;
          loadedGame.activeWorldId = loadedGame.surfaceWorldId;
          loadedGame.player.coord = fallbackSurfaceCoord;
        }
      }

      syncActiveWorldAliases(loadedGame);
      setGame({
        ...loadedGame,
        logSequence: 3,
        logs: createFreshLogsAtTime(loadedGame.seed, loadedGame.worldTimeMs),
      });
      lastSavedDungeonSerializedRef.current =
        serializePersistedDungeonWorlds(loadedGame);
    }
  }
});
```

Update `packages/client/src/app/App/hooks/useAppSettingsActions.ts` so resetting the `game` area also clears dedicated dungeon keys:

```ts
case 'game': {
  const { clearEncryptedDungeonStates, clearEncryptedState } =
    await import('../../../persistence/storage');
  await clearEncryptedState('game');
  await clearEncryptedDungeonStates();
  break;
}
```

Update the app harness mocks in `packages/client/src/app/App/tests/appTestHarness.tsx` to export `loadEncryptedDungeonState`, `saveEncryptedDungeonState`, and `clearEncryptedDungeonStates`.

- [ ] **Step 4: Run the persistence tests and verify they pass**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/persistence/storage.test.ts
pnpm --filter @realmfall/client exec vitest run --project jsdom src/app/App/tests/useAppPersistence.test.tsx
```

Expected: PASS with dedicated key round-trips, game-reset cleanup, active-dungeon hydration, and separated dungeon autosaves all green.

- [ ] **Step 5: Commit the persistence layer**

Run:

```bash
git add packages/client/src/persistence/storage.ts packages/client/src/persistence/storage.test.ts packages/client/src/app/App/persistence/dungeonSaveSegments.ts packages/client/src/app/App/persistence/saveSegments.ts packages/client/src/app/App/persistence/saveScheduler.ts packages/client/src/app/App/useAppPersistence.ts packages/client/src/app/App/tests/useAppPersistence.test.tsx packages/client/src/app/App/tests/appTestHarness.tsx packages/client/src/app/App/hooks/useAppSettingsActions.ts
git commit -m "feat: persist dungeon instances under dedicated keys"
```

### Task 5: Add The Dungeon Entry UI, Fullscreen Loading, And Dungeon-Specific Music

**Files:**

- Create: `packages/client/src/app/App/hooks/useDungeonTransitionController.ts`
- Create: `packages/client/src/app/App/tests/App.dungeonFlow.test.tsx`
- Modify: `packages/client/src/app/App/hooks/useHexGameplayView.ts`
- Modify: `packages/client/src/app/App/useAppGameView.ts`
- Modify: `packages/client/src/app/App/AppWindows.viewTypes.ts`
- Modify: `packages/client/src/app/App/hooks/useAppRuntime.ts`
- Modify: `packages/client/src/app/App/usePixiWorld.ts`
- Modify: `packages/client/src/app/audio/backgroundMusic.ts`
- Modify: `packages/client/src/app/audio/backgroundMusic.test.ts`
- Modify: `packages/client/src/ui/components/HexInfoWindow/types.ts`
- Modify: `packages/client/src/ui/components/HexInfoWindow/HexInfoWindow.tsx`
- Modify: `packages/client/src/ui/components/HexInfoWindow/HexInfoWindowContent.tsx`
- Modify: `packages/client/src/ui/components/HexInfoWindow/tests/HexInfoWindowContent.test.tsx`
- Modify: `packages/client/src/ui/components/HexInfoWindow/HexInfoWindowContent.stories.tsx`
- Modify: `packages/client/src/app/App/components/AppShell.tsx`
- Modify: `packages/client/src/app/App/components/AppShell.test.tsx`
- Test: `packages/client/src/ui/components/HexInfoWindow/tests/HexInfoWindowContent.test.tsx`
- Test: `packages/client/src/app/audio/backgroundMusic.test.ts`
- Test: `packages/client/src/app/App/tests/App.dungeonFlow.test.tsx`

- [ ] **Step 1: Write the failing UI and runtime tests**

Add this case to `packages/client/src/ui/components/HexInfoWindow/tests/HexInfoWindowContent.test.tsx`:

```tsx
it('renders explicit enter and leave dungeon buttons in the content panel', () => {
  const { rerender } = render(
    <HexInfoWindowContent
      terrain="Plains"
      structure="Rift Ruin"
      hexDescription="A dungeon entrance."
      enemyCount={0}
      canInteract
      interactAction={{ kind: 'enter-dungeon', label: 'Enter dungeon' }}
      canBulkProspectEquipment={false}
      canBulkSellEquipment={false}
      townStock={[]}
      gold={0}
      onInteract={() => undefined}
      onBuyItem={() => undefined}
      onHoverItem={() => undefined}
      onLeaveItem={() => undefined}
    />,
  );

  expect(screen.getByRole('button', { name: 'Enter dungeon' })).toBeTruthy();

  rerender(
    <HexInfoWindowContent
      terrain="Brick Halls"
      structure="Rift Ruin"
      hexDescription="The way back to the surface."
      enemyCount={0}
      canInteract
      interactAction={{ kind: 'leave-dungeon', label: 'Leave dungeon' }}
      canBulkProspectEquipment={false}
      canBulkSellEquipment={false}
      townStock={[]}
      gold={0}
      onInteract={() => undefined}
      onBuyItem={() => undefined}
      onHoverItem={() => undefined}
      onLeaveItem={() => undefined}
    />,
  );

  expect(screen.getByRole('button', { name: 'Leave dungeon' })).toBeTruthy();
});
```

Update `packages/client/src/app/audio/backgroundMusic.test.ts` with:

```ts
it('uses dungeon music for dungeon worlds even when the current tile is not the dungeon structure', () => {
  expect(
    resolveBackgroundMusicMood({
      combat: null,
      currentStructure: undefined,
      currentWorldKind: 'dungeon',
    }),
  ).toBe('dungeon');
});
```

Create `packages/client/src/app/App/tests/App.dungeonFlow.test.tsx`:

```tsx
import { renderApp, waitForAppReady } from './appTestHarness';

it('shows the fullscreen loading shell while entering a dungeon and leaves back to the surface entrance', async () => {
  const { clickHexInteract, host, readGame } = renderApp({
    seed: 'app-dungeon-flow',
    withDungeonEntranceAt: { q: 1, r: 0 },
  });

  await waitForAppReady(host);
  clickHexInteract();

  expect(host.querySelector('[aria-busy="true"]')).toBeTruthy();
  await waitFor(() =>
    expect(readGame().activeWorldId.startsWith('dungeon:')).toBe(true),
  );

  await clickHexInteract();
  expect(readGame().activeWorldId).toBe('surface');
  expect(readGame().player.coord).toEqual({ q: 1, r: 0 });
});
```

- [ ] **Step 2: Run the UI and runtime tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/ui/components/HexInfoWindow/tests/HexInfoWindowContent.test.tsx src/app/App/tests/App.dungeonFlow.test.tsx
pnpm --filter @realmfall/client exec vitest run --project node src/app/audio/backgroundMusic.test.ts
```

Expected: FAIL because the view model only exposes `interactLabel`, the content panel does not render dungeon entry or exit buttons, dungeon entry is not asynchronous, and background music only inspects the current tile structure.

- [ ] **Step 3: Add typed interact actions, async entry loading, and dungeon-world music**

Update `packages/client/src/app/App/AppWindows.viewTypes.ts` and `packages/client/src/ui/components/HexInfoWindow/types.ts`:

```ts
export type HexInteractAction =
  | { kind: 'gather'; label: string }
  | { kind: 'enter-dungeon'; label: string }
  | { kind: 'leave-dungeon'; label: string }
  | { kind: 'open-dungeon-chest'; label: string };

export interface HexViewState {
  homeHex: GameState['homeHex'];
  currentTile: Tile;
  currentTileHostileEnemyCount: number;
  combat: GameState['combat'];
  currentWorldKind: 'surface' | 'dungeon';
  interactAction: HexInteractAction | null;
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  itemModification: HexItemModificationViewState | null;
  claimStatus: ReturnType<typeof getCurrentHexClaimStatus>;
  territoryNpcHealStatus: ReturnType<typeof getCurrentHexFactionNpcHealStatus>;
  bulkProspectEquipmentExplanation: string | null;
  bulkSellEquipmentExplanation: string | null;
  townStock: ReturnType<typeof getTownStockForDay>;
  gold: number;
}
```

Update `packages/client/src/app/App/hooks/useHexGameplayView.ts`:

```ts
const currentWorldKind = activeWorld.kind;

const interactAction = useMemo(() => {
  if (currentTile.structure === 'dungeon-chest') {
    return { kind: 'open-dungeon-chest', label: 'Open chest' } as const;
  }

  if (currentWorldKind === 'surface' && currentTile.structure === 'dungeon') {
    return { kind: 'enter-dungeon', label: 'Enter dungeon' } as const;
  }

  if (
    currentWorldKind === 'dungeon' &&
    currentTile.structure === 'dungeon' &&
    activeDungeon?.dungeonId
  ) {
    return { kind: 'leave-dungeon', label: 'Leave dungeon' } as const;
  }

  const gatheringLabel = structureActionLabel(currentTile.structure);
  return gatheringLabel ? { kind: 'gather', label: gatheringLabel } : null;
}, [activeDungeon?.dungeonId, currentTile.structure, currentWorldKind]);

return {
  currentTile,
  currentWorldKind,
  interactAction,
  bulkProspectEquipmentExplanation,
  bulkSellEquipmentExplanation,
  canBulkProspectEquipment,
  canBulkSellEquipment,
  claimStatus,
  combatEnemies,
  currentTileHostileEnemyCount,
  gold,
  itemModification,
  territoryNpcHealStatus,
  townStock,
};
```

Create `packages/client/src/app/App/hooks/useDungeonTransitionController.ts`:

```ts
import { startTransition, useEffectEvent, useState } from 'react';
import { loadEncryptedDungeonState } from '../../../persistence/storage';
import {
  activateDungeonWorld,
  leaveDungeonWorld,
  registerDungeonEntrance,
} from '../../../game/stateDungeonActions';
import { generateDungeonWorld } from '../../../game/dungeons/generation/generateDungeonWorld';

function waitForNextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export function useDungeonTransitionController({
  gameRef,
  setGame,
}: {
  gameRef: MutableRefObject<GameState>;
  setGame: Dispatch<SetStateAction<GameState>>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const enterDungeon = useEffectEvent(async () => {
    const current = gameRef.current;
    const surfaceCoord = { ...current.player.coord };
    const dungeonId = registerDungeonEntrance(current, surfaceCoord);
    setError(null);
    setLoading(true);
    await waitForNextPaint();

    try {
      const persisted =
        await loadEncryptedDungeonState<DungeonWorldState>(dungeonId);
      const dungeonWorld =
        persisted ??
        generateDungeonWorld({
          dungeonId,
          gameRadius: current.radius,
          seed: current.seed,
          surfaceCoord,
        });

      startTransition(() => {
        setGame((state) =>
          activateDungeonWorld(state, {
            dungeonId,
            dungeonWorld,
            returnCoord: surfaceCoord,
          }),
        );
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught : new Error('Dungeon load failed.'),
      );
    } finally {
      setLoading(false);
    }
  });

  const leaveDungeon = useEffectEvent(() => {
    setGame((state) => leaveDungeonWorld(state));
  });

  return { enterDungeon, leaveDungeon, error, loading };
}
```

Update `packages/client/src/app/App/hooks/useAppRuntime.ts` and `usePixiWorld.ts`:

```ts
const dungeonTransition = useDungeonTransitionController({
  gameRef: bootstrap.gameRef,
  setGame: bootstrap.setGame,
});

const handleHexInteract = useEffectEvent(() => {
  switch (gameView.interactAction?.kind) {
    case 'enter-dungeon':
      void dungeonTransition.enterDungeon();
      return;
    case 'leave-dungeon':
      dungeonTransition.leaveDungeon();
      return;
    default:
      controllerActions.handleInteract();
  }
});

const isReady =
  persistence.hydrated && pixiWorld.canvasReady && !dungeonTransition.loading;
```

```ts
type VisibleWorldResolutionState = Pick<
  GameState,
  'bloodMoonActive' | 'radius' | 'seed'
> & {
  playerCoord: HexCoord;
  resolvedTiles: GameState['tiles'];
  worldKind: 'surface' | 'dungeon';
};

if (state.worldKind === 'dungeon') {
  resolutionOverlayRef.current = new Map();
  visibleTilesRef.current = buildVisibleTilesRef.current({
    overlay: resolutionOverlayRef.current,
    playerCoord: state.playerCoord,
    radius: state.radius,
    resolvedTiles: state.resolvedTiles,
  });
  return;
}
```

Update `packages/client/src/ui/components/HexInfoWindow/HexInfoWindow.tsx` and `HexInfoWindowContent.tsx` so the header button label and the content-panel action use `interactAction.label` instead of a generic `Interact` label:

```tsx
const primaryHeaderAction = interactAction ? (
  <WindowHeaderActionButton
    className={`${inventoryStyles.headerButton} ${styles.homeButton}`}
    disabled={!canInteract}
    onClick={onInteract}
    tooltipTitle={interactAction.label}
    tooltipLines={[{ kind: 'text', text: interactAction.label }]}
    tooltipBorderColor="rgba(74, 222, 128, 0.9)"
    onHoverDetail={onHoverDetail}
    onLeaveDetail={onLeaveDetail}
  >
    {interactAction.label}
  </WindowHeaderActionButton>
) : null;
```

```tsx
{
  interactAction ? (
    <div className={styles.actions}>
      <Button type="button" onClick={onInteract} disabled={!canInteract}>
        {interactAction.label}
      </Button>
    </div>
  ) : null;
}
```

Update `packages/client/src/app/audio/backgroundMusic.ts`:

```ts
export function resolveBackgroundMusicMood({
  combat,
  currentStructure,
  currentWorldKind,
}: {
  combat: CombatState | null;
  currentStructure: Tile['structure'];
  currentWorldKind: 'surface' | 'dungeon';
}): BackgroundMusicMood {
  if (combat) {
    return 'combat';
  }
  if (currentWorldKind === 'dungeon') {
    return 'dungeon';
  }
  if (currentStructure === 'town') {
    return 'town';
  }
  return 'ambient';
}
```

Update `packages/client/src/app/App/components/AppShell.tsx` so the existing fullscreen loading shell stays mounted during dungeon entry and uses the same blocking layout for dungeon-load failures.

- [ ] **Step 4: Run the UI and runtime tests and verify they pass**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/ui/components/HexInfoWindow/tests/HexInfoWindowContent.test.tsx src/app/App/tests/App.dungeonFlow.test.tsx
pnpm --filter @realmfall/client exec vitest run --project node src/app/audio/backgroundMusic.test.ts
```

Expected: PASS with explicit `Enter dungeon` and `Leave dungeon` buttons, fullscreen loading during entry, and dungeon-world music all green.

- [ ] **Step 5: Commit the UI and transition layer**

Run:

```bash
git add packages/client/src/app/App/hooks/useDungeonTransitionController.ts packages/client/src/app/App/tests/App.dungeonFlow.test.tsx packages/client/src/app/App/hooks/useHexGameplayView.ts packages/client/src/app/App/useAppGameView.ts packages/client/src/app/App/AppWindows.viewTypes.ts packages/client/src/app/App/hooks/useAppRuntime.ts packages/client/src/app/App/usePixiWorld.ts packages/client/src/app/audio/backgroundMusic.ts packages/client/src/app/audio/backgroundMusic.test.ts packages/client/src/ui/components/HexInfoWindow/types.ts packages/client/src/ui/components/HexInfoWindow/HexInfoWindow.tsx packages/client/src/ui/components/HexInfoWindow/HexInfoWindowContent.tsx packages/client/src/ui/components/HexInfoWindow/tests/HexInfoWindowContent.test.tsx packages/client/src/ui/components/HexInfoWindow/HexInfoWindowContent.stories.tsx packages/client/src/app/App/components/AppShell.tsx packages/client/src/app/App/components/AppShell.test.tsx
git commit -m "feat: add dungeon transition loading and hex actions"
```

### Task 6: Update Canonical Specs And Run Full Verification

**Files:**

- Create: `docs/specs/reference/gameplay-features/dungeons/spec.md`
- Modify: `docs/specs/reference/gameplay-features/README.md`
- Modify: `docs/specs/reference/gameplay-features/background-music/spec.md`
- Modify: `docs/specs/reference/gameplay-features/enemies-and-world-events/spec.md`
- Modify: `docs/specs/reference/gameplay-features/ui-surfaced-gameplay/spec.md`
- Modify: `docs/specs/reference/gameplay-features/world-exploration/spec.md`
- Modify: `docs/specs/reference/technical-solutions/deterministic-world-generation/spec.md`
- Modify: `docs/specs/reference/technical-solutions/persistence-and-save-compatibility/spec.md`
- Modify: `docs/specs/reference/technical-solutions/react-app-orchestration/spec.md`

- [ ] **Step 1: Update the shipped gameplay and technical specs**

Add `docs/specs/reference/gameplay-features/dungeons/spec.md` with this outline and fill it with the shipped behavior:

```md
# Dungeons

## Overview

- Surface dungeon tiles are permanent entrances with no enemies on the entrance hex.
- Each entrance owns one stable dungeon instance id and re-entry resumes the same dungeon state.
- Dungeon entry uses a fullscreen loading transition, moves the player onto the dungeon entrance tile, and exposes `Leave dungeon` only there.

## Generation

- Dungeons generate with one of `rooms-and-corridors`, `branching-spine`, or `dense-maze`.
- Every dungeon has at least 200 passable hexes, a theme package, a final elite, and a final closed chest.
- Cleared dungeons remain accessible and retired.

## Recovery

- Death inside a dungeon returns the player to the surface home or town flow and keeps dungeon progress.
```

Update the listed existing specs so they describe dungeon-world music, surface-only world events, dungeon persistence keys, and the app-level transition overlay in the same level of detail as the shipped code.

- [ ] **Step 2: Run the full client test suite**

Run:

```bash
pnpm --filter @realmfall/client test:node
pnpm --filter @realmfall/client test:jsdom
```

Expected: PASS with the complete client node and jsdom suites green.

- [ ] **Step 3: Run typecheck, lint, and the strict build-budget verification**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm build:budget:strict
```

Expected: PASS for workspace typecheck, lint, and the strict client build-budget gate.

- [ ] **Step 4: Commit the docs and final verification state**

Run:

```bash
git add docs/specs/reference/gameplay-features/dungeons/spec.md docs/specs/reference/gameplay-features/README.md docs/specs/reference/gameplay-features/background-music/spec.md docs/specs/reference/gameplay-features/enemies-and-world-events/spec.md docs/specs/reference/gameplay-features/ui-surfaced-gameplay/spec.md docs/specs/reference/gameplay-features/world-exploration/spec.md docs/specs/reference/technical-solutions/deterministic-world-generation/spec.md docs/specs/reference/technical-solutions/persistence-and-save-compatibility/spec.md docs/specs/reference/technical-solutions/react-app-orchestration/spec.md
git commit -m "docs: document dungeon instances"
```
