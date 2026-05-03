# Treasure Goblin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a treasure goblin legendary overworld enemy that spawns on ordinary hostile tiles with a `0.5%` chance, never attacks, teleports away after `3` to `5` successful damaging hits, and multiplies gold plus item rewards when killed.

**Architecture:** Keep treasure goblin identity in canonical enemy content, but resolve the special spawn in `makeEnemy` so ordinary hostile tile ids stay type-agnostic and deterministic. Ordinary field tiles already build a single enemy id in `worldTileGeneration.ts`, so the single-enemy restriction stays satisfied without changing tile generation. Add narrow combat encounter metadata to `CombatState` for flee progress, route flee logic through a focused `stateCombatTreasureGoblin.ts` helper, and apply reward multipliers in `stateRewards.ts` so the behavior composes with the existing drop pipeline instead of replacing it.

**Tech Stack:** TypeScript, React, Vitest (`node` project), Pixi-adjacent gameplay runtime helpers, `pnpm`

---

## File Structure

- `packages/client/game.config.ts`
  Add treasure goblin spawn, HP, flee, gold, and item-drop tuning knobs.
- `packages/client/src/game/gameConfigSchema.ts`
  Extend the typed gameplay config contract for the new treasure goblin tuning fields.
- `packages/client/src/game/config.ts`
  Re-export treasure goblin tuning constants from the canonical runtime config.
- `packages/client/src/game/content/ids.ts`
  Add the canonical `treasure-goblin` enemy id.
- `packages/client/src/game/content/tags.ts`
  Add a dedicated treasure goblin enemy tag so behavior and reward helpers do not depend on display names.
- `packages/client/src/game/content/icons.ts`
  Register the icon used by the treasure goblin config. Reuse an existing vendored icon instead of introducing new art in this feature.
- `packages/client/src/game/content/enemies/treasureGoblin.ts`
  Define the new enemy config.
- `packages/client/src/game/content/enemies/enemyCatalog.ts`
  Register the config and expose a narrow `isTreasureGoblinEnemyType` helper.
- `packages/client/src/game/content/enemies/index.ts`
  Re-export the new helper.
- `packages/client/src/game/content/enemies/tests/index.test.ts`
  Lock the new canonical registry entry and taxonomy tag into the enemy content surface.
- `packages/client/src/game/combat.ts`
  Resolve treasure goblin selection during eligible overworld enemy generation and multiply its legendary HP.
- `packages/client/src/game/world.ts`
  Pass an explicit ordinary-overworld spawn flag only when unresolved field-tile hostiles are materialized into live enemy state.
- `packages/client/src/game/stateWorldQueries.ts`
  Pass the same ordinary-overworld spawn flag when query helpers synthesize unresolved field enemies, while leaving claim NPCs untouched.
- `packages/client/src/game/worldTileResolutionPayloads.ts`
  Pass the same ordinary-overworld spawn flag when worker-side tile resolution serializes unresolved hostiles for the client.
- `packages/client/src/game/combat.test.ts`
  Verify eligible spawn replacement, ineligible spawn paths, and the `20x` HP rule.
- `packages/client/src/game/stateWorldQueries.test.ts`
  Verify unresolved ordinary field enemies can resolve as treasure goblins while faction NPC reconstruction cannot.
- `packages/client/src/game/worldTileResolutionPayloads.test.ts`
  Verify worker tile resolution preserves the same treasure goblin eligibility rules.
- `packages/client/src/game/types.ts`
  Extend `CombatState` with additive battle-scoped enemy encounter metadata for treasure goblin flee progress.
- `packages/client/src/game/stateCombat.ts`
  Seed the new encounter metadata when a battle is created.
- `packages/client/src/game/stateCombatTreasureGoblin.ts`
  Own treasure goblin encounter-state creation, damage-hit counting, teleport destination selection, and escape resolution.
- `packages/client/src/game/stateClone.ts`
  Clone the new combat encounter metadata in mutation paths.
- `packages/client/src/game/stateCombatEncounterSync.ts`
  Keep encounter metadata aligned with the live `enemyIds` list when combat state shrinks or ends.
- `packages/client/src/app/normalizeCombat.ts`
  Preserve the new additive combat save shape and default missing metadata safely for older saves.
- `packages/client/src/app/normalize.test.ts`
  Verify mid-combat treasure goblin encounter metadata survives hydration.
- `packages/client/src/game/stateCombatTreasureGoblin.test.ts`
  Cover no-attack behavior, flee thresholds, zero-damage non-progression, teleport success, and invalid destination rejection.
- `packages/client/src/game/stateCombatCasting.ts`
  Prevent treasure goblins from starting enemy casts.
- `packages/client/src/game/stateCombatPlayerAbility.ts`
  Count successful direct-damage hits against treasure goblins and trigger escape resolution after damage lands.
- `packages/client/src/game/combatStatus.ts`
  Count successful damage-over-time ticks against treasure goblins and trigger escape resolution after ticking damage lands.
- `packages/client/src/i18n/locales/en.json`
  Add the treasure goblin name and escape combat log copy.
- `packages/client/src/game/stateRewards.ts`
  Apply treasure goblin item-drop chance, item-rarity scale, and gold-quantity multipliers.
- `packages/client/src/game/stateRewards.test.ts`
  Lock the reward multipliers into deterministic node tests.
- `docs/specs/reference/gameplay-features/combat/spec.md`
  Document no-attack and teleport-escape combat behavior.
- `docs/specs/reference/gameplay-features/enemies-and-world-events/spec.md`
  Document the ordinary-overworld `0.5%` spawn rule.
- `docs/specs/reference/gameplay-features/items-loot-and-equipment/spec.md`
  Document the loot and gold multiplier behavior.

### Task 1: Add Canonical Treasure Goblin Content And Eligible Spawn Rules

**Files:**

- Modify: `packages/client/game.config.ts`
- Modify: `packages/client/src/game/gameConfigSchema.ts`
- Modify: `packages/client/src/game/config.ts`
- Modify: `packages/client/src/game/content/ids.ts`
- Modify: `packages/client/src/game/content/tags.ts`
- Modify: `packages/client/src/game/content/icons.ts`
- Create: `packages/client/src/game/content/enemies/treasureGoblin.ts`
- Modify: `packages/client/src/game/content/enemies/enemyCatalog.ts`
- Modify: `packages/client/src/game/content/enemies/index.ts`
- Modify: `packages/client/src/game/content/enemies/tests/index.test.ts`
- Modify: `packages/client/src/game/combat.ts`
- Modify: `packages/client/src/game/world.ts`
- Modify: `packages/client/src/game/stateWorldQueries.ts`
- Modify: `packages/client/src/game/worldTileResolutionPayloads.ts`
- Modify: `packages/client/src/game/combat.test.ts`
- Modify: `packages/client/src/game/stateWorldQueries.test.ts`
- Modify: `packages/client/src/game/worldTileResolutionPayloads.test.ts`
- Test: `packages/client/src/game/content/enemies/tests/index.test.ts`
- Test: `packages/client/src/game/combat.test.ts`
- Test: `packages/client/src/game/stateWorldQueries.test.ts`
- Test: `packages/client/src/game/worldTileResolutionPayloads.test.ts`

- [ ] **Step 1: Write the failing content and spawn tests**

```ts
// packages/client/src/game/content/enemies/tests/index.test.ts
it('registers treasure goblin as a canonical enemy type with a dedicated tag', () => {
  expect(getEnemyConfig('treasure-goblin')?.name).toBe('Treasure Goblin');
  expect(getEnemyConfig('treasure-goblin')?.tags).toContain(
    GAME_TAGS.enemy.treasureGoblin,
  );
});
```

```ts
// packages/client/src/game/combat.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GAME_CONFIG } from './config';
import { EnemyTypeId } from './content/ids';

const previousTreasureGoblinChance =
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblinChance;

afterEach(() => {
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblinChance =
    previousTreasureGoblinChance;
});

it('replaces an eligible overworld hostile spawn with treasure goblin only on the normal field path', () => {
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblinChance = 1;

  const fieldEnemy = makeEnemy(
    'treasure-goblin-field',
    { q: 4, r: -2 },
    'plains',
    0,
    undefined,
    false,
    {
      allowTreasureGoblinOverride: true,
    },
  );
  const dungeonEnemy = makeEnemy(
    'treasure-goblin-field',
    { q: 4, r: -2 },
    'plains',
    0,
    'dungeon',
  );
  const explicitEnemy = makeEnemy(
    'treasure-goblin-field',
    { q: 4, r: -2 },
    'plains',
    0,
    undefined,
    false,
    {
      enemyTypeId: EnemyTypeId.Raider,
      rarity: 'common',
    },
  );

  expect(fieldEnemy.enemyTypeId).toBe('treasure-goblin');
  expect(fieldEnemy.rarity).toBe('legendary');
  expect(dungeonEnemy.enemyTypeId).not.toBe('treasure-goblin');
  expect(explicitEnemy.enemyTypeId).toBe('raider');
});

it('multiplies treasure goblin HP from the ordinary legendary baseline without changing attack or defense', () => {
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblinChance = 1;

  const treasureGoblin = makeEnemy(
    'treasure-goblin-baseline',
    { q: 6, r: -3 },
    'forest',
    0,
    undefined,
    false,
    {
      allowTreasureGoblinOverride: true,
    },
  );
  const comparisonLegendary = makeEnemy(
    'treasure-goblin-baseline',
    { q: 6, r: -3 },
    'forest',
    0,
    undefined,
    false,
    {
      enemyTypeId: EnemyTypeId.Raider,
      rarity: 'legendary',
    },
  );

  expect(treasureGoblin.maxHp).toBe(comparisonLegendary.maxHp * 20);
  expect(treasureGoblin.attack).toBe(comparisonLegendary.attack);
  expect(treasureGoblin.defense).toBe(comparisonLegendary.defense);
});
```

```ts
// packages/client/src/game/worldTileResolutionPayloads.test.ts
it('only forwards treasure goblin override for unresolved ordinary hostile tiles', async () => {
  const makeEnemyMock = vi.fn(() => ({
    id: 'enemy-2,0-0',
    name: 'Treasure Goblin',
    coord: { q: 2, r: 0 },
    tier: 1,
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    xp: 0,
    elite: true,
  }));

  vi.doMock('./combat', () => ({
    enemyIndexFromId: () => 0,
    makeEnemy: makeEnemyMock,
  }));
  vi.doMock('./territories', () => ({
    isFactionNpcEnemyId: (enemyId: string) =>
      enemyId.startsWith('faction-npc:'),
  }));
  vi.doMock('./worldBoss', () => ({
    isWorldBossEnemyId: () => false,
  }));
  vi.doMock('./world', () => ({
    buildTile: (_seed: string, coord: { q: number; r: number }) =>
      coord.q === 2
        ? {
            coord,
            terrain: 'plains',
            items: [],
            structure: undefined,
            enemyIds: ['enemy-2,0-0'],
          }
        : {
            coord,
            terrain: 'plains',
            items: [],
            structure: undefined,
            enemyIds: ['faction-npc:3:0'],
            claim: {
              ownerId: 'faction-1',
              ownerType: 'faction',
              ownerName: 'Arkenreach',
              borderColor: '#ffffff',
              npc: {
                name: 'Sera',
                enemyId: 'faction-npc:3:0',
              },
            },
          },
  }));

  const { resolveWorldTiles: resolveMockedWorldTiles } =
    await import('./worldTileResolutionPayloads');

  resolveMockedWorldTiles({
    requestId: 'req-treasure-goblin-worker',
    seed: 'treasure-goblin-worker',
    bloodMoonActive: false,
    coords: [
      { q: 2, r: 0 },
      { q: 3, r: 0 },
    ],
  });

  expect(makeEnemyMock.mock.calls[0]?.[6]).toMatchObject({
    allowTreasureGoblinOverride: true,
    aggressive: true,
  });
  expect(makeEnemyMock.mock.calls[1]?.[6]).toMatchObject({
    allowTreasureGoblinOverride: false,
    aggressive: false,
  });
});
```

```ts
// packages/client/src/game/stateWorldQueries.test.ts
import { afterEach } from 'vitest';
import { GAME_CONFIG } from './config';
import { createGame } from './state';
import { getEnemiesAt } from './stateWorldQueries';
import { makeFactionNpcEnemyId } from './territories';

const previousTreasureGoblinChance =
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblinChance;

afterEach(() => {
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblinChance =
    previousTreasureGoblinChance;
});

it('resolves unresolved ordinary hostiles as treasure goblins without rewriting faction NPC tiles', () => {
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblinChance = 1;

  const hostileGame = createGame(3, 'treasure-goblin-query-hostile');
  hostileGame.tiles['2,0'] = {
    coord: { q: 2, r: 0 },
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: ['enemy-2,0-0'],
  };

  expect(getEnemiesAt(hostileGame, { q: 2, r: 0 })[0]?.enemyTypeId).toBe(
    'treasure-goblin',
  );

  const npcGame = createGame(3, 'treasure-goblin-query-npc');
  const npcId = makeFactionNpcEnemyId({ q: 2, r: 0 });
  npcGame.tiles['2,0'] = {
    coord: { q: 2, r: 0 },
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: [npcId],
    claim: {
      ownerId: 'faction-1',
      ownerType: 'faction',
      ownerName: 'Arkenreach',
      borderColor: '#ffffff',
      npc: {
        name: 'Sera',
        enemyId: npcId,
      },
    },
  };

  expect(getEnemiesAt(npcGame, { q: 2, r: 0 })[0]?.enemyTypeId).not.toBe(
    'treasure-goblin',
  );
});
```

- [ ] **Step 2: Run the targeted failing node tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/content/enemies/tests/index.test.ts src/game/combat.test.ts
```

Expected: FAIL because `treasure-goblin` does not exist in the enemy registry, the new config fields are missing, and `makeEnemy` does not replace eligible field spawns yet.

- [ ] **Step 3: Write the minimal content, config, and spawn implementation**

```ts
// packages/client/src/game/content/ids.ts
export enum EnemyTypeId {
  Gluttony = 'gluttony',
  TreasureGoblin = 'treasure-goblin',
  Raider = 'raider',
  Marauder = 'marauder',
  Wolf = 'wolf',
  Boar = 'boar',
  Stag = 'stag',
  Spider = 'spider',
}
```

```ts
// packages/client/src/game/content/tags.ts
// add alongside the other enemy tag enum entries
EnemyTreasureGoblin = 'enemy.treasureGoblin',

// inside GAME_TAGS.enemy
treasureGoblin: GameTag.EnemyTreasureGoblin,
```

```ts
// packages/client/game.config.ts
// inside balance.enemy
treasureGoblin: {
  hpMultiplier: 20,
  fleeMinHits: 3,
  fleeMaxHits: 5,
  fleeRadius: 10,
},

// inside worldGeneration.enemySpawn
treasureGoblinChance: 0.005,

// inside drops.enemyGold
treasureGoblinMultiplier: 20,

// inside drops.enemyItem.chance
treasureGoblinMultiplier: 3,
treasureGoblinRarityMultiplier: 3,
```

```ts
// packages/client/src/game/gameConfigSchema.ts
enemy: {
  treasureGoblin: {
    hpMultiplier: number;
    fleeMinHits: number;
    fleeMaxHits: number;
    fleeRadius: number;
  }
}

enemySpawn: {
  tile: number;
  treasureGoblinChance: number;
}

enemyGold: {
  treasureGoblinMultiplier: number;
}

enemyItem: {
  chance: {
    treasureGoblinMultiplier: number;
    treasureGoblinRarityMultiplier: number;
  }
}
```

```ts
// packages/client/src/game/config.ts
export const TREASURE_GOBLIN_BALANCE = GAME_CONFIG.balance.enemy.treasureGoblin;
export const TREASURE_GOBLIN_SPAWN_CHANCE =
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblinChance;
```

```ts
// packages/client/src/game/content/enemies/treasureGoblin.ts
import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const treasureGoblinEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.TreasureGoblin,
  name: enemyName('treasure-goblin'),
  icon: ContentIcons.Coins,
  tint: 0xfacc15,
  appearanceChanceByTerrain: {},
  tags: buildEnemyTags({
    tags: [GAME_TAGS.enemy.humanoid, GAME_TAGS.enemy.treasureGoblin],
  }),
};
```

```ts
// packages/client/src/game/content/enemies/enemyCatalog.ts
import { EnemyTypeId } from '../ids';
import { treasureGoblinEnemyConfig } from './treasureGoblin';

const RAW_ENEMY_CONFIGS = [
  gluttonyEnemyConfig,
  treasureGoblinEnemyConfig,
  raiderEnemyConfig,
  marauderEnemyConfig,
  wolfEnemyConfig,
  boarEnemyConfig,
  stagEnemyConfig,
  spiderEnemyConfig,
] as const;

export function isTreasureGoblinEnemyType(enemyTypeId: string | undefined) {
  return enemyTypeId === EnemyTypeId.TreasureGoblin;
}
```

```ts
// packages/client/src/game/content/enemies/index.ts
export {
  ENEMY_CONFIGS,
  getEnemyConfig,
  isAnimalEnemyType,
  isTreasureGoblinEnemyType,
} from './enemyCatalog';
```

```ts
// packages/client/src/game/combat.ts
import {
  TREASURE_GOBLIN_BALANCE,
  TREASURE_GOBLIN_SPAWN_CHANCE,
} from './config';
import { EnemyTypeId } from './content/ids';
import {
  getEnemyConfig,
  isAnimalEnemyType,
  isTreasureGoblinEnemyType,
  pickEnemyConfig,
} from './content/enemies';

function shouldSpawnTreasureGoblin({
  seed,
  coord,
  index,
  structure,
  worldBoss,
  options,
}: {
  seed: string;
  coord: HexCoord;
  index: number;
  structure?: StructureType;
  worldBoss: boolean;
  options?: {
    enemyId?: string;
    enemyTypeId?: EnemyTypeKey;
    aggressive?: boolean;
    rarity?: EnemyRarity;
    name?: string;
    worldBoss?: boolean;
    allowTreasureGoblinOverride?: boolean;
  };
}) {
  if (!options?.allowTreasureGoblinOverride) return false;
  if (index !== 0) return false;
  if (structure) return false;
  if (worldBoss) return false;
  if (options?.enemyTypeId) return false;
  if (TREASURE_GOBLIN_SPAWN_CHANCE <= 0) return false;

  return (
    noise(`${seed}:enemy:treasure-goblin`, coord) < TREASURE_GOBLIN_SPAWN_CHANCE
  );
}

// inside makeEnemy
const forcedTreasureGoblin = shouldSpawnTreasureGoblin({
  seed,
  coord,
  index,
  structure,
  worldBoss,
  options,
});
const config = forcedTreasureGoblin
  ? getEnemyConfig(EnemyTypeId.TreasureGoblin)!
  : worldBoss
    ? pickEnemyConfig(terrain, roll, false, true)
    : options?.enemyTypeId
      ? (getEnemyConfig(options.enemyTypeId) ??
        pickEnemyConfig(terrain, roll, structure === 'dungeon'))
      : pickEnemyConfig(terrain, roll, structure === 'dungeon');

const rarity = forcedTreasureGoblin
  ? 'legendary'
  : options?.enemyTypeId
    ? (options.rarity ?? 'common')
    : worldBoss
      ? 'legendary'
      : resolveEnemyRarity(
          createRng(`${seed}:enemy:rarity:${index}:${coord.q}:${coord.r}`),
          enemyRarityMinimum(structure, worldBoss),
          tier,
          structure,
        );

const treasureGoblinHpMultiplier = isTreasureGoblinEnemyType(config.id)
  ? TREASURE_GOBLIN_BALANCE.hpMultiplier
  : 1;
const scaledMaxHp =
  (worldBoss ? baseMaxHp * 50 : baseMaxHp) * treasureGoblinHpMultiplier;
```

```json
// packages/client/src/i18n/locales/en.json
"game.enemy.treasure-goblin.name": "Treasure Goblin",
```

```ts
// packages/client/src/game/world.ts
const canResolveTreasureGoblin =
  !tile.claim &&
  !tile.structure &&
  enemyIndexFromId(enemyId) === 0 &&
  !isFactionNpcEnemyId(enemyId);

state.enemies[enemyId] = makeEnemy(
  state.seed,
  coord,
  tile.terrain,
  enemyIndexFromId(enemyId),
  tile.structure,
  state.bloodMoonActive,
  {
    enemyId,
    name: enemyName,
    aggressive: !isFactionNpcEnemyId(enemyId),
    worldBoss: isWorldBossEnemyId(enemyId),
    allowTreasureGoblinOverride: canResolveTreasureGoblin,
  },
);
```

```ts
// packages/client/src/game/stateWorldQueries.ts
const hostile = isHostileTileEnemy(state, tile, enemyId);
const canResolveTreasureGoblin =
  hostile && !tile.claim && !tile.structure && enemyIndexFromId(enemyId) === 0;

return makeEnemy(
  state.seed,
  coord,
  tile.terrain,
  enemyIndexFromId(enemyId),
  tile.structure,
  state.bloodMoonActive,
  {
    enemyId,
    aggressive: hostile,
    name: enemyName,
    worldBoss: isWorldBossEnemyId(enemyId),
    allowTreasureGoblinOverride: canResolveTreasureGoblin,
  },
);
```

```ts
// packages/client/src/game/worldTileResolutionPayloads.ts
const hostile = !isFactionNpcEnemyId(enemyId);
const canResolveTreasureGoblin =
  hostile &&
  !runtimeTile.claim &&
  !runtimeTile.structure &&
  enemyIndexFromId(enemyId) === 0;

makeEnemy(
  seed,
  coord,
  runtimeTile.terrain,
  enemyIndexFromId(enemyId),
  runtimeTile.structure,
  bloodMoonActive,
  {
    enemyId,
    aggressive: hostile,
    name:
      runtimeTile.claim?.npc?.enemyId === enemyId
        ? runtimeTile.claim.npc.name
        : undefined,
    worldBoss: isWorldBossEnemyId(enemyId),
    allowTreasureGoblinOverride: canResolveTreasureGoblin,
  },
);
```

- [ ] **Step 4: Re-run the targeted node tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/content/enemies/tests/index.test.ts src/game/combat.test.ts src/game/stateWorldQueries.test.ts src/game/worldTileResolutionPayloads.test.ts
```

Expected: PASS with the new canonical enemy content registered, ordinary unresolved field hostiles resolving to treasure goblin, and claim NPC plus worker-resolution edge paths staying excluded.

- [ ] **Step 5: Commit**

```bash
git add packages/client/game.config.ts packages/client/src/game/gameConfigSchema.ts packages/client/src/game/config.ts packages/client/src/game/content/ids.ts packages/client/src/game/content/tags.ts packages/client/src/game/content/icons.ts packages/client/src/game/content/enemies/treasureGoblin.ts packages/client/src/game/content/enemies/enemyCatalog.ts packages/client/src/game/content/enemies/index.ts packages/client/src/game/content/enemies/tests/index.test.ts packages/client/src/game/combat.ts packages/client/src/game/world.ts packages/client/src/game/stateWorldQueries.ts packages/client/src/game/worldTileResolutionPayloads.ts packages/client/src/game/combat.test.ts packages/client/src/game/stateWorldQueries.test.ts packages/client/src/game/worldTileResolutionPayloads.test.ts packages/client/src/i18n/locales/en.json
pnpm git:commit -- -m "feat: add treasure goblin content and spawn rules"
```

### Task 2: Add Battle-Scoped Treasure Goblin Encounter Metadata And Save Support

**Files:**

- Modify: `packages/client/src/game/types.ts`
- Modify: `packages/client/src/game/stateCombat.ts`
- Create: `packages/client/src/game/stateCombatTreasureGoblin.ts`
- Modify: `packages/client/src/game/stateClone.ts`
- Modify: `packages/client/src/game/stateCombatEncounterSync.ts`
- Modify: `packages/client/src/app/normalizeCombat.ts`
- Modify: `packages/client/src/app/normalize.test.ts`
- Modify: `packages/client/src/game/combatAutomation.test.ts`
- Modify: `packages/client/src/game/stateCombatCadence.test.ts`
- Modify: `packages/client/src/game/stateCombatEncounterSync.test.ts`
- Modify: `packages/client/src/game/stateSurvival.test.ts`
- Modify: `packages/client/src/app/audio/voiceEvents.test.ts`
- Modify: `packages/client/src/app/audio/backgroundMusic.test.ts`
- Test: `packages/client/src/app/normalize.test.ts`
- Test: `packages/client/src/game/combatAutomation.test.ts`
- Test: `packages/client/src/game/stateCombatCadence.test.ts`
- Test: `packages/client/src/game/stateCombatEncounterSync.test.ts`
- Test: `packages/client/src/game/stateSurvival.test.ts`
- Test: `packages/client/src/app/audio/voiceEvents.test.ts`
- Test: `packages/client/src/app/audio/backgroundMusic.test.ts`

- [ ] **Step 1: Write the failing combat-metadata and hydration tests**

```ts
// packages/client/src/app/normalize.test.ts
it('preserves treasure goblin combat encounter metadata when hydrating a save', () => {
  const game = createGame(3, 'normalize-treasure-goblin-combat');
  const enemyId = 'enemy-2,0-0';

  game.combat = {
    coord: { q: 2, r: 0 },
    enemyIds: [enemyId],
    started: true,
    player: {
      abilityIds: ['kick'],
      globalCooldownMs: 2_000,
      globalCooldownEndsAt: 0,
      cooldownEndsAt: {},
      casting: null,
    },
    enemies: {
      [enemyId]: {
        abilityIds: ['kick'],
        globalCooldownMs: 2_000,
        globalCooldownEndsAt: 0,
        cooldownEndsAt: {},
        casting: null,
      },
    },
    enemyStateById: {
      [enemyId]: {
        treasureGoblin: {
          damageHitsTaken: 2,
          fleeHitsRequired: 4,
        },
      },
    },
  };

  expect(normalizeLoadedGame(game)?.combat?.enemyStateById[enemyId]).toEqual({
    treasureGoblin: {
      damageHitsTaken: 2,
      fleeHitsRequired: 4,
    },
  });
});
```

```ts
// packages/client/src/game/stateCombatEncounterSync.test.ts
it('drops treasure goblin encounter metadata when the enemy leaves the encounter', () => {
  const game = createGame(3, 'combat-sync-treasure-goblin');
  const coord = { q: 2, r: 0 };
  const enemyId = 'enemy-2,0-0';

  game.tiles['2,0'] = {
    coord,
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: [],
  };
  game.combat = {
    coord,
    enemyIds: [enemyId],
    started: true,
    player: createCombatActorState(0, ['kick']),
    enemies: {
      [enemyId]: createCombatActorState(0, ['kick']),
    },
    enemyStateById: {
      [enemyId]: {
        treasureGoblin: {
          damageHitsTaken: 3,
          fleeHitsRequired: 3,
        },
      },
    },
  };

  syncCombatEncounterEnemies(game);

  expect(game.combat).toBeNull();
});
```

- [ ] **Step 2: Run the targeted failing node tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/normalize.test.ts src/game/combatAutomation.test.ts src/game/stateCombatCadence.test.ts src/game/stateCombatEncounterSync.test.ts src/game/stateSurvival.test.ts src/app/audio/voiceEvents.test.ts src/app/audio/backgroundMusic.test.ts
```

Expected: FAIL because `CombatState` has no treasure goblin encounter metadata yet, the clone path does not preserve it, combat hydration drops the new fields, and typed combat fixtures do not include the new map.

- [ ] **Step 3: Write the minimal combat-state, clone, and normalization implementation**

```ts
// packages/client/src/game/types.ts
export interface TreasureGoblinCombatState {
  damageHitsTaken: number;
  fleeHitsRequired: number;
}

export interface CombatEnemyEncounterState {
  treasureGoblin?: TreasureGoblinCombatState;
}

export interface CombatState {
  coord: HexCoord;
  enemyIds: string[];
  started: boolean;
  startedAtMs?: number;
  player: CombatActorState;
  enemies: Record<string, CombatActorState>;
  enemyStateById: Record<string, CombatEnemyEncounterState>;
}
```

```ts
// packages/client/src/game/stateCombatTreasureGoblin.ts
import { createRng } from './random';
import { TREASURE_GOBLIN_BALANCE } from './config';
import { isTreasureGoblinEnemyType } from './content/enemies';
import type { CombatEnemyEncounterState, GameState } from './types';

export function createCombatEnemyEncounterState(
  state: GameState,
  enemyId: string,
  encounterSeed: number,
): CombatEnemyEncounterState {
  const enemy = state.enemies[enemyId];
  if (!enemy || !isTreasureGoblinEnemyType(enemy.enemyTypeId)) {
    return {};
  }

  const minHits = TREASURE_GOBLIN_BALANCE.fleeMinHits;
  const maxHits = TREASURE_GOBLIN_BALANCE.fleeMaxHits;
  const rng = createRng(
    `${state.seed}:combat:treasure-goblin:${enemyId}:${encounterSeed}`,
  );

  return {
    treasureGoblin: {
      damageHitsTaken: 0,
      fleeHitsRequired: minHits + Math.floor(rng() * (maxHits - minHits + 1)),
    },
  };
}
```

```ts
// packages/client/src/game/stateCombat.ts
import { createCombatEnemyEncounterState } from './stateCombatTreasureGoblin';

export function createCombatState(
  state: GameState,
  coord: HexCoord,
  enemyIds: string[],
  worldTimeMs: number,
): GameState['combat'] {
  return {
    coord,
    enemyIds: [...enemyIds],
    started: false,
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
        createCombatEnemyEncounterState(state, enemyId, worldTimeMs),
      ]),
    ),
  };
}
```

```ts
// packages/client/src/game/stateClone.ts
const enemyStateById = Object.fromEntries(
  combat.enemyIds.map((enemyId) => {
    const metadata = combat.enemyStateById[enemyId];
    return [
      enemyId,
      metadata?.treasureGoblin
        ? {
            treasureGoblin: { ...metadata.treasureGoblin },
          }
        : {},
    ] as const;
  }),
);

return {
  ...combat,
  coord: { ...combat.coord },
  enemyIds: [...combat.enemyIds],
  player: {
    ...combatPlayer,
    abilityIds: [...combatPlayer.abilityIds],
    cooldownEndsAt: { ...combatPlayer.cooldownEndsAt },
    casting: combatPlayer.casting ? { ...combatPlayer.casting } : null,
  },
  enemies: Object.fromEntries(
    Object.entries(combatEnemies).map(([enemyId, actor]) => [
      enemyId,
      {
        ...actor,
        abilityIds: [...actor.abilityIds],
        cooldownEndsAt: { ...actor.cooldownEndsAt },
        casting: actor.casting ? { ...actor.casting } : null,
      },
    ]),
  ),
  enemyStateById,
};
```

```ts
// packages/client/src/game/stateCombatEncounterSync.ts
state.combat.enemyStateById = Object.fromEntries(
  enemyIds.map((enemyId) => [
    enemyId,
    state.combat?.enemyStateById[enemyId] ?? {},
  ]),
);
```

```ts
// packages/client/src/game/combatAutomation.test.ts
game.combat = {
  coord,
  enemyIds: [enemyId],
  started: true,
  player: playerActor,
  enemies: {
    [enemyId]: enemyActor,
  },
  enemyStateById: {
    [enemyId]: {},
  },
};
```

Apply the same `enemyStateById` empty-map addition to these typed combat fixtures:

- `packages/client/src/game/stateCombatCadence.test.ts`
- `packages/client/src/game/stateSurvival.test.ts`
- `packages/client/src/app/audio/voiceEvents.test.ts`
- `packages/client/src/app/audio/backgroundMusic.test.ts`

```ts
// packages/client/src/app/normalizeCombat.ts
function normalizeCombatEnemyStates(value: unknown, enemyIds: string[]) {
  if (!isRecord(value)) {
    return Object.fromEntries(enemyIds.map((enemyId) => [enemyId, {}]));
  }

  return Object.fromEntries(
    enemyIds.map((enemyId) => {
      const metadata = isRecord(value[enemyId]) ? value[enemyId] : {};
      const treasureGoblin =
        isRecord(metadata.treasureGoblin) &&
        isFiniteNumber(metadata.treasureGoblin.damageHitsTaken) &&
        isFiniteNumber(metadata.treasureGoblin.fleeHitsRequired)
          ? {
              damageHitsTaken: metadata.treasureGoblin.damageHitsTaken,
              fleeHitsRequired: metadata.treasureGoblin.fleeHitsRequired,
            }
          : undefined;

      return [enemyId, treasureGoblin ? { treasureGoblin } : {}] as const;
    }),
  );
}

if (value.startedAtMs !== undefined && !isFiniteNumber(value.startedAtMs)) {
  return null;
}

const enemyIds = [...value.enemyIds];
return {
  coord,
  enemyIds,
  started: value.started,
  ...(value.startedAtMs === undefined
    ? {}
    : { startedAtMs: value.startedAtMs }),
  player,
  enemies,
  enemyStateById: normalizeCombatEnemyStates(value.enemyStateById, enemyIds),
};
```

- [ ] **Step 4: Re-run the targeted node tests**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/app/normalize.test.ts src/game/combatAutomation.test.ts src/game/stateCombatCadence.test.ts src/game/stateCombatEncounterSync.test.ts src/game/stateSurvival.test.ts src/app/audio/voiceEvents.test.ts src/app/audio/backgroundMusic.test.ts
```

Expected: PASS with additive combat metadata preserved through save hydration and synchronized away when the live encounter no longer contains that enemy.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/game/types.ts packages/client/src/game/stateCombat.ts packages/client/src/game/stateCombatTreasureGoblin.ts packages/client/src/game/stateClone.ts packages/client/src/game/stateCombatEncounterSync.ts packages/client/src/app/normalizeCombat.ts packages/client/src/app/normalize.test.ts packages/client/src/game/combatAutomation.test.ts packages/client/src/game/stateCombatCadence.test.ts packages/client/src/game/stateCombatEncounterSync.test.ts packages/client/src/game/stateSurvival.test.ts packages/client/src/app/audio/voiceEvents.test.ts packages/client/src/app/audio/backgroundMusic.test.ts
pnpm git:commit -- -m "refactor: persist treasure goblin combat state"
```

### Task 3: Implement Treasure Goblin No-Attack And Teleport Escape Behavior

**Files:**

- Modify: `packages/client/src/game/stateCombatTreasureGoblin.ts`
- Modify: `packages/client/src/game/stateCombatCasting.ts`
- Modify: `packages/client/src/game/stateCombatPlayerAbility.ts`
- Modify: `packages/client/src/game/combatStatus.ts`
- Modify: `packages/client/src/i18n/locales/en.json`
- Create: `packages/client/src/game/stateCombatTreasureGoblin.test.ts`
- Test: `packages/client/src/game/stateCombatTreasureGoblin.test.ts`

- [ ] **Step 1: Write the failing treasure goblin combat-behavior tests**

```ts
// packages/client/src/game/stateCombatTreasureGoblin.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { GAME_CONFIG } from './config';
import {
  createCombatEncounterGame,
  seedCombatEncounter,
} from './stateCombatTestHelpers';
import { getTileAt, moveToTile, progressCombat, startCombat } from './state';
import { createCombatActorState } from './combat';
import { findTreasureGoblinEscapeCoord } from './stateCombatTreasureGoblin';

const previousFleeMinHits =
  GAME_CONFIG.balance.enemy.treasureGoblin.fleeMinHits;
const previousFleeMaxHits =
  GAME_CONFIG.balance.enemy.treasureGoblin.fleeMaxHits;

afterEach(() => {
  GAME_CONFIG.balance.enemy.treasureGoblin.fleeMinHits = previousFleeMinHits;
  GAME_CONFIG.balance.enemy.treasureGoblin.fleeMaxHits = previousFleeMaxHits;
});

it('never lets treasure goblin start an enemy cast loop', () => {
  const game = createCombatEncounterGame('treasure-goblin-no-attack');
  const target = seedCombatEncounter(game, {
    id: 'enemy-2,0-0',
    enemyTypeId: 'treasure-goblin',
    name: 'Treasure Goblin',
    rarity: 'legendary',
    tier: 8,
    hp: 8000,
    maxHp: 8000,
    attack: 500,
    defense: 100,
    xp: 5,
    elite: true,
  });

  const encountered = moveToTile(game, target);
  const started = startCombat(encountered);
  const afterCooldown = progressCombat({
    ...started,
    worldTimeMs: started.worldTimeMs + 10_000,
  });

  expect(afterCooldown.player.hp).toBe(started.player.hp);
});

it('teleports treasure goblin away and ends combat after the configured number of successful damaging hits', () => {
  GAME_CONFIG.balance.enemy.treasureGoblin.fleeMinHits = 3;
  GAME_CONFIG.balance.enemy.treasureGoblin.fleeMaxHits = 3;

  const game = createCombatEncounterGame('treasure-goblin-escape');
  const target = seedCombatEncounter(game, {
    id: 'enemy-2,0-0',
    enemyTypeId: 'treasure-goblin',
    name: 'Treasure Goblin',
    rarity: 'legendary',
    tier: 8,
    hp: 12000,
    maxHp: 12000,
    attack: 0,
    defense: 0,
    xp: 5,
    elite: true,
  });

  const encountered = moveToTile(game, target);
  const firstHit = startCombat(encountered);
  const secondHit = progressCombat({
    ...firstHit,
    worldTimeMs: firstHit.worldTimeMs + 2_000,
  });
  const thirdHit = progressCombat({
    ...secondHit,
    worldTimeMs: secondHit.worldTimeMs + 2_000,
  });

  expect(thirdHit.combat).toBeNull();
  expect(thirdHit.enemies['enemy-2,0-0']?.coord).not.toEqual(target);
  expect(getTileAt(thirdHit, target).enemyIds).toEqual([]);
});

it('does not count zero-damage hits toward treasure goblin escape', () => {
  GAME_CONFIG.balance.enemy.treasureGoblin.fleeMinHits = 1;
  GAME_CONFIG.balance.enemy.treasureGoblin.fleeMaxHits = 1;

  const game = createCombatEncounterGame('treasure-goblin-no-damage');
  const target = seedCombatEncounter(game, {
    id: 'enemy-2,0-0',
    enemyTypeId: 'treasure-goblin',
    name: 'Treasure Goblin',
    rarity: 'legendary',
    tier: 8,
    hp: 12000,
    maxHp: 12000,
    attack: 0,
    defense: 999_999,
    xp: 5,
    elite: true,
  });

  const encountered = moveToTile(game, target);
  const started = startCombat(encountered);

  expect(started.combat).not.toBeNull();
  expect(started.enemies['enemy-2,0-0']?.coord).toEqual(target);
});

it('rejects blocked teleport destinations when no free escape hex exists in range', () => {
  const game = createCombatEncounterGame('treasure-goblin-no-destination');
  const target = seedCombatEncounter(game, {
    id: 'enemy-2,0-0',
    enemyTypeId: 'treasure-goblin',
    name: 'Treasure Goblin',
    rarity: 'legendary',
    tier: 8,
    hp: 12000,
    maxHp: 12000,
    attack: 0,
    defense: 0,
    xp: 5,
    elite: true,
  });

  game.player.coord = target;
  game.tiles['3,0'] = {
    coord: { q: 3, r: 0 },
    terrain: 'plains',
    items: [],
    structure: 'camp',
    enemyIds: [],
  };
  game.tiles['3,-1'] = {
    coord: { q: 3, r: -1 },
    terrain: 'mountain',
    items: [],
    enemyIds: [],
  };
  game.tiles['2,-1'] = {
    coord: { q: 2, r: -1 },
    terrain: 'plains',
    items: [],
    enemyIds: ['occupied'],
  };
  game.tiles['1,0'] = {
    coord: { q: 1, r: 0 },
    terrain: 'plains',
    items: [],
    claim: {
      ownerId: 'faction',
      ownerType: 'faction',
      ownerName: 'Wardens',
      borderColor: '#fff',
    },
    enemyIds: [],
  };
  game.tiles['1,1'] = {
    coord: { q: 1, r: 1 },
    terrain: 'plains',
    items: [],
    structure: 'town',
    enemyIds: [],
  };
  game.tiles['2,1'] = {
    coord: { q: 2, r: 1 },
    terrain: 'plains',
    items: [],
    enemyIds: ['occupied-two'],
  };

  expect(
    findTreasureGoblinEscapeCoord(game, game.enemies['enemy-2,0-0']!, {
      radius: 1,
    }),
  ).toBeNull();
});
```

- [ ] **Step 2: Run the targeted failing node test**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateCombatTreasureGoblin.test.ts
```

Expected: FAIL because treasure goblins can still cast like normal enemies, damage hits are not tracked, there is no teleport helper, and zero-damage hits do not have special handling.

- [ ] **Step 3: Write the minimal treasure goblin combat implementation**

```ts
// packages/client/src/game/stateCombatTreasureGoblin.ts
import { t } from '../i18n';
import { TREASURE_GOBLIN_BALANCE } from './config';
import { isTreasureGoblinEnemyType } from './content/enemies';
import { hexDistance, hexKey, hexesInRange } from './hex';
import { addLog } from './logs';
import { createRng } from './random';
import { isPassable } from './shared';
import { syncCombatEncounterEnemies } from './stateCombatEncounterSync';
import { isWorldBossFootprintOccupied } from './stateWorldBoss';
import { ensureTileState } from './world';
import type { Enemy, GameState } from './types';

export function isTreasureGoblinEnemy(
  enemy: Pick<Enemy, 'enemyTypeId' | 'tags'> | undefined,
) {
  return isTreasureGoblinEnemyType(enemy?.enemyTypeId);
}

export function findTreasureGoblinEscapeCoord(
  state: GameState,
  enemy: Enemy,
  { radius = TREASURE_GOBLIN_BALANCE.fleeRadius }: { radius?: number } = {},
) {
  const candidates = hexesInRange(enemy.coord, radius)
    .filter((coord) => hexDistance(coord, enemy.coord) > 0)
    .filter(
      (coord) =>
        coord.q !== state.player.coord.q || coord.r !== state.player.coord.r,
    );

  const valid = candidates.filter((coord) => {
    ensureTileState(state, coord);
    const tile = state.tiles[hexKey(coord)];
    if (!tile) return false;
    if (!isPassable(tile.terrain)) return false;
    if (tile.claim) return false;
    if (tile.structure) return false;
    if (tile.enemyIds.length > 0) return false;
    if (isWorldBossFootprintOccupied(state, coord)) return false;
    return true;
  });

  if (valid.length === 0) {
    return null;
  }

  const rng = createRng(
    `${state.seed}:treasure-goblin:escape:${enemy.id}:${state.turn}:${state.worldTimeMs}`,
  );
  return valid[Math.floor(rng() * valid.length)] ?? valid[0] ?? null;
}

export function recordTreasureGoblinDamageHits(
  state: GameState,
  enemyId: string,
  hits = 1,
) {
  const treasureGoblinState =
    state.combat?.enemyStateById[enemyId]?.treasureGoblin;
  if (!treasureGoblinState || hits <= 0) return;

  treasureGoblinState.damageHitsTaken += hits;
}

export function maybeResolveTreasureGoblinEscape(
  state: GameState,
  enemyId: string,
) {
  if (!state.combat) return false;

  const enemy = state.enemies[enemyId];
  const treasureGoblinState =
    state.combat.enemyStateById[enemyId]?.treasureGoblin;
  if (!enemy || !treasureGoblinState || enemy.hp <= 0) return false;
  if (
    treasureGoblinState.damageHitsTaken < treasureGoblinState.fleeHitsRequired
  ) {
    return false;
  }

  const destination = findTreasureGoblinEscapeCoord(state, enemy);
  if (!destination) return false;

  ensureTileState(state, destination);
  const fromTile = state.tiles[hexKey(enemy.coord)]!;
  const toTile = state.tiles[hexKey(destination)]!;

  fromTile.enemyIds = fromTile.enemyIds.filter(
    (currentEnemyId) => currentEnemyId !== enemyId,
  );
  toTile.enemyIds = [...toTile.enemyIds, enemyId];
  enemy.coord = destination;

  addLog(
    state,
    'combat',
    t('game.message.combat.treasureGoblinEscape', {
      enemy: enemy.name,
      q: destination.q,
      r: destination.r,
    }),
  );
  syncCombatEncounterEnemies(state);
  return true;
}
```

```ts
// packages/client/src/game/stateCombatCasting.ts
import { isTreasureGoblinEnemy } from './stateCombatTreasureGoblin';

// inside startEnemyCasts
const enemy = state.enemies[enemyId];
if (!actor || actor.casting || !enemy) return;
if (isTreasureGoblinEnemy(enemy)) return;
```

```ts
// packages/client/src/game/stateCombatPlayerAbility.ts
import {
  maybeResolveTreasureGoblinEscape,
  recordTreasureGoblinDamageHits,
} from './stateCombatTreasureGoblin';

// inside dealPlayerDamageToEnemy, after enemy.hp changes and after logs/on-hit effects:
if (damageResolution.damage > 0) {
  recordTreasureGoblinDamageHits(state, enemy.id, 1);
}

// inside applyPlayerAbility, after each damage effect finishes and before defeat cleanup:
for (const enemy of enemyTargets) {
  if (enemy.hp > 0 && maybeResolveTreasureGoblinEscape(state, enemy.id)) {
    continue;
  }

  if (enemy.hp <= 0) {
    handleEnemyDefeat(state, enemy);
  }
}
```

```ts
// packages/client/src/game/combatStatus.ts
import {
  maybeResolveTreasureGoblinEscape,
  recordTreasureGoblinDamageHits,
} from './stateCombatTreasureGoblin';

if (damagePerTick > 0) {
  enemy.hp = Math.max(0, enemy.hp - damagePerTick * tickCount);
  changed = true;
  recordTreasureGoblinDamageHits(state, enemy.id, tickCount);

  if (enemy.hp > 0 && maybeResolveTreasureGoblinEscape(state, enemy.id)) {
    return true;
  }
}
```

```json
// packages/client/src/i18n/locales/en.json
"game.message.combat.treasureGoblinEscape": "{enemy} vanishes in a flash of gold and escapes to {q}, {r}.",
```

- [ ] **Step 4: Re-run the targeted node test**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateCombatTreasureGoblin.test.ts
```

Expected: PASS with treasure goblins refusing to attack, zero-damage hits ignored, successful damaging hits advancing flee state, valid escapes ending combat, and invalid destinations rejected.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/game/stateCombatTreasureGoblin.ts packages/client/src/game/stateCombatCasting.ts packages/client/src/game/stateCombatPlayerAbility.ts packages/client/src/game/combatStatus.ts packages/client/src/game/stateCombatTreasureGoblin.test.ts packages/client/src/i18n/locales/en.json
pnpm git:commit -- -m "feat: add treasure goblin escape behavior"
```

### Task 4: Apply Treasure Goblin Reward Multipliers

**Files:**

- Modify: `packages/client/src/game/stateRewards.ts`
- Modify: `packages/client/src/game/stateRewards.test.ts`
- Test: `packages/client/src/game/stateRewards.test.ts`

- [ ] **Step 1: Write the failing treasure goblin reward tests**

```ts
// packages/client/src/game/stateRewards.test.ts
import { ItemId } from './content/ids';
import {
  dropEnemyRewards,
  getEnemyDropRarityChanceScale,
  getEnemyItemDropChance,
} from './stateRewards';

it('triples treasure goblin item-drop chance before clamping', () => {
  const game = createCombatEncounterGame('treasure-goblin-item-chance');
  const target = { q: 2, r: 0 };
  seedCombatEncounter(game, {
    id: 'enemy-test',
    enemyTypeId: 'treasure-goblin',
    name: 'Treasure Goblin',
    rarity: 'legendary',
    coord: target,
    tier: 1,
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    xp: 5,
    elite: true,
  });

  ENEMY_ITEM_DROP_CHANCES.chance.base = 0.2;
  ENEMY_ITEM_DROP_CHANCES.chance.perRarity = 0;
  ENEMY_ITEM_DROP_CHANCES.chance.max = 1;

  expect(getEnemyItemDropChance(game, game.enemies['enemy-test']!)).toBe(0.6);
});

it('triples treasure goblin item-rarity scale on top of ordinary combat drops', () => {
  const game = createCombatEncounterGame('treasure-goblin-rarity-scale');
  const target = { q: 2, r: 0 };
  seedCombatEncounter(game, {
    id: 'enemy-test',
    enemyTypeId: 'treasure-goblin',
    name: 'Treasure Goblin',
    rarity: 'legendary',
    coord: target,
    tier: 1,
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    xp: 5,
    elite: true,
  });

  expect(getEnemyDropRarityChanceScale(game, game.enemies['enemy-test']!)).toBe(
    3,
  );
});

it('multiplies treasure goblin gold quantity after the standard drop roll succeeds', () => {
  const game = createCombatEncounterGame('treasure-goblin-gold');
  const target = { q: 2, r: 0 };
  seedCombatEncounter(game, {
    id: 'enemy-test',
    enemyTypeId: 'treasure-goblin',
    name: 'Treasure Goblin',
    rarity: 'legendary',
    coord: target,
    tier: 1,
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    xp: 5,
    elite: true,
  });

  ENEMY_GOLD_DROP_CHANCES.base = 1;
  ENEMY_GOLD_DROP_CHANCES.perTier = 0;
  ENEMY_GOLD_DROP_CHANCES.perRarity = 0;
  ENEMY_GOLD_DROP_CHANCES.eliteBonus = 0;
  ENEMY_GOLD_DROP_CHANCES.max = 1;
  ENEMY_GOLD_DROP_CHANCES.quantity.minimum = 1;
  ENEMY_GOLD_DROP_CHANCES.quantity.tierWeight = 0;
  ENEMY_GOLD_DROP_CHANCES.quantity.rarityWeight = 0;
  ENEMY_GOLD_DROP_CHANCES.quantity.randomBase = 1;
  ENEMY_GOLD_DROP_CHANCES.quantity.randomRarityWeight = 0;
  ENEMY_RECIPE_DROP_CHANCES.base = 0;
  ENEMY_RECIPE_DROP_CHANCES.max = 0;
  HOME_SCROLL_DROP_CHANCES.max = 0;
  GAME_CONFIG.drops.terraformingConsumableChance = 0;

  dropEnemyRewards(game, game.enemies['enemy-test']!);

  expect(
    getTileAt(game, target).items.find((item) => item.itemKey === ItemId.Gold)
      ?.quantity,
  ).toBe(20);
});
```

- [ ] **Step 2: Run the targeted failing node test**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateRewards.test.ts
```

Expected: FAIL because `stateRewards.ts` does not expose treasure goblin-aware drop helpers and treasure goblin kills use the ordinary gold plus item rules.

- [ ] **Step 3: Write the minimal treasure goblin reward implementation**

```ts
// packages/client/src/game/stateRewards.ts
import { isTreasureGoblinEnemyType } from './content/enemies';

function isTreasureGoblinEnemy(enemy: Pick<Enemy, 'enemyTypeId'>) {
  return isTreasureGoblinEnemyType(enemy.enemyTypeId);
}

export function getEnemyItemDropChance(state: GameState, enemy: Enemy) {
  const baseChance = Math.min(
    ENEMY_ITEM_DROP_CHANCES.chance.max,
    ENEMY_ITEM_DROP_CHANCES.chance.base +
      enemyRarityIndex(enemy.rarity) * ENEMY_ITEM_DROP_CHANCES.chance.perRarity,
  );

  return Math.min(
    ENEMY_ITEM_DROP_CHANCES.chance.max,
    baseChance *
      (isTreasureGoblinEnemy(enemy)
        ? ENEMY_ITEM_DROP_CHANCES.chance.treasureGoblinMultiplier
        : 1),
  );
}

function maybeDropEnemyItem(state: GameState, enemy: Enemy) {
  const chance = getEnemyItemDropChance(state, enemy);
  const rarityChanceScale = getEnemyDropRarityChanceScale(state, enemy);
  const rng = createRng(`${state.seed}:enemy-item:${enemy.id}:${state.turn}`);
  if (rng() >= chance) return;

  const sortedKinds = getSortedEnemyItemKinds();
  for (const [kind, kindChance] of sortedKinds) {
    if (rng() >= clampChance(kindChance)) continue;
    const drop = makeEnemyDrop(state, enemy, kind, rng, rarityChanceScale);
    if (!drop) continue;
    addEnemyDrop(state, enemy, drop);
  }
}

export function getEnemyDropRarityChanceScale(state: GameState, enemy: Enemy) {
  const tile = state.tiles[hexKey(enemy.coord)];
  const dungeonMultiplier =
    tile?.structure === 'dungeon'
      ? ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER
      : 1;
  const bloodMoonMultiplier = state.bloodMoonActive
    ? ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER
    : 1;
  const treasureGoblinMultiplier = isTreasureGoblinEnemy(enemy)
    ? ENEMY_ITEM_DROP_CHANCES.chance.treasureGoblinRarityMultiplier
    : 1;

  return dungeonMultiplier * bloodMoonMultiplier * treasureGoblinMultiplier;
}

// inside maybeDropEnemyGold, after the ordinary quantity calculation:
const finalQuantity = isTreasureGoblinEnemy(enemy)
  ? bloodMoonQuantity * ENEMY_GOLD_DROP_CHANCES.treasureGoblinMultiplier
  : bloodMoonQuantity;
addItemToInventory(tile.items, makeGoldStack(finalQuantity));
```

- [ ] **Step 4: Re-run the targeted node test**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project node src/game/stateRewards.test.ts
```

Expected: PASS with deterministic tests proving the `x3` item-drop chance, `x3` item-rarity scale, and `x20` gold quantity behavior.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/game/stateRewards.ts packages/client/src/game/stateRewards.test.ts
pnpm git:commit -- -m "feat: boost treasure goblin rewards"
```

### Task 5: Update Canonical Specs And Run Full Verification

**Files:**

- Modify: `docs/specs/reference/gameplay-features/combat/spec.md`
- Modify: `docs/specs/reference/gameplay-features/enemies-and-world-events/spec.md`
- Modify: `docs/specs/reference/gameplay-features/items-loot-and-equipment/spec.md`

- [ ] **Step 1: Update the shipped gameplay specs**

```md
<!-- docs/specs/reference/gameplay-features/combat/spec.md -->

- Treasure goblins are a special legendary encounter that never casts or attacks.
- Each treasure goblin battle rolls a deterministic escape threshold of `3` to `5` successful damaging hits.
- When that threshold is reached and a free escape hex exists within radius `10`, the treasure goblin teleports away, leaves the current hex, and the current battle ends.
```

```md
<!-- docs/specs/reference/gameplay-features/enemies-and-world-events/spec.md -->

- Ordinary hostile overworld spawns have a deterministic `0.5%` chance to resolve as a single treasure goblin encounter instead of the ordinary field enemy.
- Treasure goblins do not replace dungeon enemy packs, world bosses, faction NPCs, or explicit ambush/debug enemy selections.
- Treasure goblins use ordinary legendary attack and defense scaling but `20x` legendary max HP.
```

```md
<!-- docs/specs/reference/gameplay-features/items-loot-and-equipment/spec.md -->

- Killing a treasure goblin triples the ordinary enemy item-drop entry chance, triples generated item-rarity scaling for that drop pass, and multiplies the resolved gold quantity by `20`.
- Treasure goblin reward multipliers apply only if the goblin dies before escaping.
```

- [ ] **Step 2: Run the full verification path**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build:budget:strict
```

Expected:

- `typecheck`: PASS
- `lint`: PASS
- `test`: PASS
- `build:budget:strict`: PASS with the bundle budget check reporting success

- [ ] **Step 3: Commit the finished behavior and docs**

```bash
git add docs/specs/reference/gameplay-features/combat/spec.md docs/specs/reference/gameplay-features/enemies-and-world-events/spec.md docs/specs/reference/gameplay-features/items-loot-and-equipment/spec.md
pnpm git:commit -- -m "docs: record treasure goblin gameplay"
```
