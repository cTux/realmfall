# Terrain Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-hex terrain noise with province-scale biome generation, macro blocker features, and a much larger visual terrain catalog that renders connected mountain and rift structures without broad gameplay-table rewrites.

**Architecture:** Split terrain generation into focused core helpers for province growth, subtle sub-biome selection, and macro feature stamping, while keeping the public tile-facing terrain API stable. Expand the asset pipeline to generate many terrain atlas frames from family recipes, then teach the renderer to pick deterministic connectivity-aware frames for blockers.

**Tech Stack:** TypeScript, Vitest, Node.js asset scripts, Sharp, Pixi terrain atlas rendering, pnpm workspaces

---

## File Structure

### Core generation

- Create: `packages/core/src/game/worldTerrainFamilies.ts`
  Responsibility: canonical biome-family, visual-variant, and gameplay-family metadata.
- Create: `packages/core/src/game/worldTerrainProvinces.ts`
  Responsibility: deterministic province seeding, growth, merge, and minimum-size enforcement.
- Create: `packages/core/src/game/worldTerrainFeatures.ts`
  Responsibility: mountain-range and rift-belt feature graph generation plus connectivity descriptors.
- Create: `packages/core/src/game/worldTerrainVariantSelection.ts`
  Responsibility: choose subtle in-family terrain variants after province and feature passes.
- Modify: `packages/core/src/game/worldTerrain.ts`
  Responsibility: orchestrate the new passes while preserving the public exports.
- Modify: `packages/client-web/src/game/worldTerrain.ts`
  Responsibility: keep the client facade aligned with any new exports from core.
- Modify: `packages/client-web/src/game/worldTerrainTestkit.ts`
  Responsibility: re-export new terrain helpers for tests.
- Modify: `packages/client-web/src/game/worldTerrain.test.ts`
  Responsibility: deterministic generation coverage for province size, feature continuity, and gameplay-family stability.

### Asset generation

- Create: `packages/client-web/scripts/world-terrain-family-recipes.mjs`
  Responsibility: family palettes, subtle visual-variant definitions, and blocker-variant recipe definitions.
- Create: `packages/client-web/scripts/generate-surface-terrain-variants.mjs`
  Responsibility: emit generated terrain PNGs for passable and non-passable families.
- Modify: `packages/client-web/scripts/world-terrain-atlas.config.mjs`
  Responsibility: register the expanded terrain atlas inputs and connectivity-aware blocker frames.
- Modify: `packages/client-web/scripts/build-world-terrain-atlas.mjs`
  Responsibility: validate the larger generated atlas set before writing the manifest.

### Renderer and atlas usage

- Create: `packages/client-web/src/ui/world/worldTerrainConnectivity.ts`
  Responsibility: deterministic frame-key selection for mountain and rift neighborhood shapes.
- Modify: `packages/client-web/src/ui/world/worldTerrainArt.ts`
  Responsibility: expose atlas frame ids for expanded terrain variants and connectivity-aware blockers.
- Modify: `packages/client-web/src/ui/world/renderSceneStaticTiles.ts`
  Responsibility: select the correct terrain frame for each tile during static redraw.
- Create: `packages/client-web/src/ui/world/worldTerrainConnectivity.test.ts`
  Responsibility: focused connectivity-selection tests.
- Modify: `packages/client-web/src/ui/world/worldTerrainArt.test.ts`
  Responsibility: atlas lookup coverage for the expanded terrain id set.

### Documentation and verification

- Modify: `docs/superpowers/specs/2026-05-12-terrain-rework-design.md`
  Responsibility: small sync edits only if the implementation uncovers a necessary clarified invariant.
- Create: `docs/superpowers/plans/2026-05-12-terrain-rework.md`
  Responsibility: this implementation plan.

### Verification commands

- `pnpm --filter @realmfall/client-web test -- src/game/worldTerrain.test.ts`
- `pnpm --filter @realmfall/client-web test -- src/ui/world/worldTerrainConnectivity.test.ts src/ui/world/worldTerrainArt.test.ts`
- `pnpm --filter @realmfall/client-web build:client:assets`
- `pnpm test`

---

### Task 1: Introduce Canonical Terrain-Family Metadata

**Files:**

- Create: `packages/core/src/game/worldTerrainFamilies.ts`
- Modify: `packages/core/src/game/worldTerrain.ts`
- Modify: `packages/client-web/src/game/worldTerrain.ts`
- Modify: `packages/client-web/src/game/worldTerrainTestkit.ts`
- Test: `packages/client-web/src/game/worldTerrain.test.ts`

- [ ] **Step 1: Write the failing metadata test**

```ts
it('maps visual terrain variants back to canonical gameplay terrain families', () => {
  expect(getTerrainGameplayFamily('plains-bloom')).toBe('plains');
  expect(getTerrainGameplayFamily('forest-moss')).toBe('forest');
  expect(getTerrainGameplayFamily('mountain-ridge')).toBe('mountain');
  expect(getTerrainGameplayFamily('rift-fork')).toBe('rift');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @realmfall/client-web test -- src/game/worldTerrain.test.ts`
Expected: FAIL with a TypeScript or runtime error that `getTerrainGameplayFamily` and the new terrain ids do not exist.

- [ ] **Step 3: Write the minimal metadata implementation**

```ts
// packages/core/src/game/worldTerrainFamilies.ts
import type { Terrain } from './types';

export type TerrainFamilyId =
  | 'grassland'
  | 'woodland'
  | 'wetland'
  | 'arid'
  | 'alpine'
  | 'corrupted'
  | 'dungeon';

export interface TerrainFamilyDefinition {
  family: TerrainFamilyId;
  gameplayTerrain: Terrain;
  passable: boolean;
  tierBonus: number;
  worldBossEligible: boolean;
}

export const TERRAIN_FAMILY_BY_TERRAIN = {
  plains: {
    family: 'grassland',
    gameplayTerrain: 'plains',
    passable: true,
    tierBonus: 0,
    worldBossEligible: false,
  },
  'plains-bloom': {
    family: 'grassland',
    gameplayTerrain: 'plains',
    passable: true,
    tierBonus: 0,
    worldBossEligible: false,
  },
  forest: {
    family: 'woodland',
    gameplayTerrain: 'forest',
    passable: true,
    tierBonus: 0,
    worldBossEligible: true,
  },
  'forest-moss': {
    family: 'woodland',
    gameplayTerrain: 'forest',
    passable: true,
    tierBonus: 0,
    worldBossEligible: true,
  },
  mountain: {
    family: 'alpine',
    gameplayTerrain: 'mountain',
    passable: false,
    tierBonus: 2,
    worldBossEligible: false,
  },
  'mountain-ridge': {
    family: 'alpine',
    gameplayTerrain: 'mountain',
    passable: false,
    tierBonus: 2,
    worldBossEligible: false,
  },
  rift: {
    family: 'corrupted',
    gameplayTerrain: 'rift',
    passable: false,
    tierBonus: 2,
    worldBossEligible: false,
  },
  'rift-fork': {
    family: 'corrupted',
    gameplayTerrain: 'rift',
    passable: false,
    tierBonus: 2,
    worldBossEligible: false,
  },
} as const satisfies Record<string, TerrainFamilyDefinition>;

export function getTerrainGameplayFamily(terrain: Terrain) {
  return TERRAIN_FAMILY_BY_TERRAIN[terrain].gameplayTerrain;
}
```

- [ ] **Step 4: Update the public terrain helpers to use the new metadata**

```ts
// packages/core/src/game/worldTerrain.ts
import {
  TERRAIN_FAMILY_BY_TERRAIN,
  getTerrainGameplayFamily,
} from './worldTerrainFamilies';

export function getTerrainProfile(terrain: Terrain) {
  const definition = TERRAIN_FAMILY_BY_TERRAIN[terrain];
  return {
    biome: definition.family,
    passable: definition.passable,
    tierBonus: definition.tierBonus,
    contentTerrain: definition.gameplayTerrain,
    worldBossEligible: definition.worldBossEligible,
  };
}

export { getTerrainGameplayFamily } from './worldTerrainFamilies';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @realmfall/client-web test -- src/game/worldTerrain.test.ts`
Expected: PASS for the new gameplay-family mapping assertions.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/game/worldTerrainFamilies.ts packages/core/src/game/worldTerrain.ts packages/client-web/src/game/worldTerrain.ts packages/client-web/src/game/worldTerrainTestkit.ts packages/client-web/src/game/worldTerrain.test.ts
git commit -m "refactor: add terrain family metadata"
```

---

### Task 2: Replace Per-Hex Noise With Province And Feature Passes

**Files:**

- Create: `packages/core/src/game/worldTerrainProvinces.ts`
- Create: `packages/core/src/game/worldTerrainFeatures.ts`
- Create: `packages/core/src/game/worldTerrainVariantSelection.ts`
- Modify: `packages/core/src/game/worldTerrain.ts`
- Test: `packages/client-web/src/game/worldTerrain.test.ts`

- [ ] **Step 1: Write the failing generation tests**

```ts
it('keeps each sampled biome province at or above twenty connected hexes', () => {
  expect(findSmallProvince('terrain-province-size', 16)).toBeNull();
});

it('forms connected mountain ranges and rift belts instead of isolated blockers', () => {
  const summary = summarizeBlockerFeatures('terrain-features', 18);
  expect(summary.longestMountainChain).toBeGreaterThanOrEqual(6);
  expect(summary.longestRiftChain).toBeGreaterThanOrEqual(5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @realmfall/client-web test -- src/game/worldTerrain.test.ts`
Expected: FAIL because province and feature helpers are not implemented and the current generator has no province metadata.

- [ ] **Step 3: Implement deterministic province growth**

```ts
// packages/core/src/game/worldTerrainProvinces.ts
import { hexKey, hexNeighbors, type HexCoord } from './hex';
import { createRng } from './random';
import type { TerrainFamilyId } from './worldTerrainFamilies';

export interface TerrainProvince {
  id: string;
  family: TerrainFamilyId;
  members: HexCoord[];
}

export function buildTerrainProvinceMap(seed: string, coords: HexCoord[]) {
  const provinces = seedProvinceStarts(seed, coords);
  growProvinceFrontiers(seed, provinces, coords);
  mergeSmallProvinces(seed, provinces, 20);
  return provinces;
}

function mergeSmallProvinces(
  seed: string,
  provinces: TerrainProvince[],
  minimumSize: number,
) {
  const rng = createRng(`${seed}:province:merge`);
  for (const province of provinces.filter(
    (entry) => entry.members.length < minimumSize,
  )) {
    const mergeTarget = pickCompatibleNeighborProvince(
      province,
      provinces,
      rng,
    );
    mergeTarget.members.push(...province.members);
    province.members = [];
  }
}
```

- [ ] **Step 4: Implement macro blocker feature stamping and variant selection**

```ts
// packages/core/src/game/worldTerrainFeatures.ts
import type { HexCoord } from './hex';
import type { Terrain } from './types';

export interface TerrainFeatureStamp {
  featureId: string;
  terrain: Terrain;
  coord: HexCoord;
  connectivity: 'isolated' | 'end' | 'straight' | 'bend' | 'fork' | 'massif';
}

export function buildMacroTerrainFeatures(seed: string, coords: HexCoord[]) {
  return [
    ...buildMountainRanges(`${seed}:mountains`, coords),
    ...buildRiftBelts(`${seed}:rifts`, coords),
  ];
}

// packages/core/src/game/worldTerrainVariantSelection.ts
export function pickProvinceTerrainVariant(
  family: TerrainFamilyId,
  detail: number,
) {
  if (family === 'grassland') {
    return detail > 0.66
      ? 'plains-bloom'
      : detail > 0.33
        ? 'meadow'
        : 'steppe-soft';
  }
  if (family === 'woodland') {
    return detail > 0.5 ? 'forest-moss' : 'grove-fern';
  }
  return 'plains';
}
```

- [ ] **Step 5: Rewire `pickTerrain` to orchestrate the new passes**

```ts
// packages/core/src/game/worldTerrain.ts
export function pickTerrain(seed: string, coord: HexCoord): Terrain {
  const climate = sampleTerrainClimate(seed, coord);
  const province = getTerrainProvinceAt(seed, coord, climate);
  const featureStamp = getMacroTerrainFeatureAt(seed, coord);

  if (featureStamp) {
    return softenTerrainNearOrigin(featureStamp.terrain, climate.distance);
  }

  return softenTerrainNearOrigin(
    pickProvinceTerrainVariant(
      province.family,
      sampleVariantDetail(`${seed}:terrain:variant`, coord),
    ),
    climate.distance,
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @realmfall/client-web test -- src/game/worldTerrain.test.ts`
Expected: PASS for province minimum-size coverage, blocker continuity coverage, and existing deterministic/safe-start coverage.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/game/worldTerrainProvinces.ts packages/core/src/game/worldTerrainFeatures.ts packages/core/src/game/worldTerrainVariantSelection.ts packages/core/src/game/worldTerrain.ts packages/client-web/src/game/worldTerrain.test.ts
git commit -m "feat: add province terrain generation"
```

---

### Task 3: Generate The Expanded Surface Terrain Catalog

**Files:**

- Create: `packages/client-web/scripts/world-terrain-family-recipes.mjs`
- Create: `packages/client-web/scripts/generate-surface-terrain-variants.mjs`
- Modify: `packages/client-web/scripts/world-terrain-atlas.config.mjs`
- Modify: `packages/client-web/scripts/build-world-terrain-atlas.mjs`

- [ ] **Step 1: Write the failing atlas-generation test or validation**

```ts
const requiredFrames = [
  'plains-bloom',
  'steppe-soft',
  'forest-moss',
  'grove-fern',
  'mountain-ridge',
  'mountain-bend',
  'rift-straight',
  'rift-fork',
];

for (const frameId of requiredFrames) {
  if (!manifest.frames[frameId]) {
    throw new Error(`Missing generated terrain frame: ${frameId}`);
  }
}
```

- [ ] **Step 2: Run the asset build to verify it fails**

Run: `pnpm --filter @realmfall/client-web build:client:assets`
Expected: FAIL because the new generated terrain frames and recipe modules do not exist yet.

- [ ] **Step 3: Add family recipes and surface-variant generation**

```js
// packages/client-web/scripts/world-terrain-family-recipes.mjs
export const TERRAIN_FAMILY_RECIPES = {
  grassland: {
    base: 'plains-v2.png',
    variants: [
      {
        id: 'plains-bloom',
        brightness: 1.02,
        saturation: 0.96,
        overlay: 'flowers',
      },
      {
        id: 'steppe-soft',
        brightness: 0.94,
        saturation: 0.82,
        overlay: 'dry-grass',
      },
    ],
  },
  woodland: {
    base: 'forest-v2.png',
    variants: [
      {
        id: 'forest-moss',
        brightness: 0.96,
        saturation: 0.78,
        overlay: 'moss',
      },
      { id: 'grove-fern', brightness: 1.01, saturation: 0.88, overlay: 'fern' },
    ],
  },
  alpine: {
    base: 'highlands-v2.png',
    variants: [
      {
        id: 'mountain-ridge',
        brightness: 0.87,
        saturation: 0.62,
        overlay: 'ridge',
      },
      {
        id: 'mountain-bend',
        brightness: 0.84,
        saturation: 0.58,
        overlay: 'ridge-bend',
      },
    ],
  },
};
```

- [ ] **Step 4: Wire the atlas config to the generated files**

```js
// packages/client-web/scripts/world-terrain-atlas.config.mjs
import { GENERATED_SURFACE_TERRAIN_SOURCES } from './world-terrain-family-recipes.mjs';

export const WORLD_TERRAIN_ATLAS_SOURCES = [
  ...BASE_WORLD_TERRAIN_ATLAS_SOURCES,
  ...GENERATED_SURFACE_TERRAIN_SOURCES.map((entry) => ({
    id: entry.id,
    source: `packages/client-web/src/assets/images/terrain/generated/${entry.file}`,
  })),
];
```

- [ ] **Step 5: Harden the atlas builder validation**

```js
// packages/client-web/scripts/build-world-terrain-atlas.mjs
for (const source of WORLD_TERRAIN_ATLAS_SOURCES) {
  if (!(await exists(source.source))) {
    throw new Error(
      `World terrain atlas source is missing: ${source.id} -> ${source.source}`,
    );
  }
}
```

- [ ] **Step 6: Run the asset build to verify it passes**

Run: `pnpm --filter @realmfall/client-web build:client:assets`
Expected: PASS and regenerated files under `packages/client-web/src/assets/images/terrain/generated/` plus an updated `packages/client-web/src/assets/generated/world-terrain-atlas.json`.

- [ ] **Step 7: Commit**

```bash
git add packages/client-web/scripts/world-terrain-family-recipes.mjs packages/client-web/scripts/generate-surface-terrain-variants.mjs packages/client-web/scripts/world-terrain-atlas.config.mjs packages/client-web/scripts/build-world-terrain-atlas.mjs packages/client-web/src/assets/images/terrain/generated packages/client-web/src/assets/generated/world-terrain-atlas.json packages/client-web/src/assets/generated/world-terrain-atlas.png
git commit -m "feat: generate terrain variant atlas"
```

---

### Task 4: Select Connectivity-Aware Blocker Frames In The Renderer

**Files:**

- Create: `packages/client-web/src/ui/world/worldTerrainConnectivity.ts`
- Create: `packages/client-web/src/ui/world/worldTerrainConnectivity.test.ts`
- Modify: `packages/client-web/src/ui/world/worldTerrainArt.ts`
- Modify: `packages/client-web/src/ui/world/worldTerrainArt.test.ts`
- Modify: `packages/client-web/src/ui/world/renderSceneStaticTiles.ts`

- [ ] **Step 1: Write the failing renderer tests**

```ts
it('maps three connected mountain tiles to a straight ridge frame', () => {
  expect(
    pickConnectedTerrainFrame('mountain', [
      { q: 0, r: -1 },
      { q: 0, r: 1 },
    ]),
  ).toBe('world-terrain-atlas:mountain-straight');
});

it('maps a branching rift neighborhood to a fork frame', () => {
  expect(
    pickConnectedTerrainFrame('rift', [
      { q: 1, r: 0 },
      { q: -1, r: 0 },
      { q: 0, r: 1 },
    ]),
  ).toBe('world-terrain-atlas:rift-fork');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @realmfall/client-web test -- src/ui/world/worldTerrainConnectivity.test.ts src/ui/world/worldTerrainArt.test.ts`
Expected: FAIL because connectivity-aware frame selection does not exist.

- [ ] **Step 3: Implement deterministic connectivity selection**

```ts
// packages/client-web/src/ui/world/worldTerrainConnectivity.ts
import type { HexCoord } from '@realmfall/core/game/stateTypes';

export function pickConnectedTerrainFrame(
  terrain: 'mountain' | 'rift',
  connectedNeighbors: HexCoord[],
) {
  if (connectedNeighbors.length >= 4) {
    return `${terrain}-massif` as const;
  }
  if (connectedNeighbors.length === 3) {
    return `${terrain}-fork` as const;
  }
  if (connectedNeighbors.length === 2) {
    return neighborsAreOpposed(connectedNeighbors)
      ? `${terrain}-straight`
      : `${terrain}-bend`;
  }
  if (connectedNeighbors.length === 1) {
    return `${terrain}-end` as const;
  }
  return `${terrain}-isolated` as const;
}
```

- [ ] **Step 4: Thread the frame selection through terrain art lookup**

```ts
// packages/client-web/src/ui/world/worldTerrainArt.ts
export function terrainArtFor(
  terrain: Terrain,
  options?: { connectedNeighbors?: HexCoord[] },
) {
  if (
    (terrain === 'mountain' || terrain === 'rift') &&
    options?.connectedNeighbors
  ) {
    const variant = pickConnectedTerrainFrame(
      terrain,
      options.connectedNeighbors,
    );
    return getWorldTerrainFrameId(variant as Terrain);
  }

  return WORLD_TERRAIN_ART[terrain];
}
```

- [ ] **Step 5: Update static tile rendering to pass neighborhood context**

```ts
// packages/client-web/src/ui/world/renderSceneStaticTiles.ts
const connectedNeighbors = getConnectedTerrainNeighbors(
  tile.coord,
  tile.terrain,
  tiles,
);
const terrainFrame = terrainArtFor(tile.terrain, { connectedNeighbors });
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @realmfall/client-web test -- src/ui/world/worldTerrainConnectivity.test.ts src/ui/world/worldTerrainArt.test.ts`
Expected: PASS for connectivity-shape selection and atlas lookup coverage.

- [ ] **Step 7: Commit**

```bash
git add packages/client-web/src/ui/world/worldTerrainConnectivity.ts packages/client-web/src/ui/world/worldTerrainConnectivity.test.ts packages/client-web/src/ui/world/worldTerrainArt.ts packages/client-web/src/ui/world/worldTerrainArt.test.ts packages/client-web/src/ui/world/renderSceneStaticTiles.ts
git commit -m "feat: render connected terrain blockers"
```

---

### Task 5: Full Verification, Tuning Pass, And Spec Sync

**Files:**

- Modify: `packages/client-web/src/game/worldTerrain.test.ts`
- Modify: `packages/client-web/src/ui/world/worldTerrainConnectivity.test.ts`
- Modify: `packages/client-web/src/ui/world/worldTerrainArt.test.ts`
- Modify: `docs/superpowers/specs/2026-05-12-terrain-rework-design.md`

- [ ] **Step 1: Add any missing end-to-end assertions discovered during implementation**

```ts
it('keeps the safe-start ring free of impassable macro blockers', () => {
  expect(
    sampleCoords(2).every((coord) =>
      isPassable(pickTerrain('safe-start', coord)),
    ),
  ).toBe(true);
});

it('preserves atlas coverage for every exported terrain frame id', () => {
  for (const assetId of getWorldTerrainAssetIds()) {
    expect(() => getWorldTerrainFrame(assetId)).not.toThrow();
  }
});
```

- [ ] **Step 2: Run focused tests and the asset build**

Run: `pnpm --filter @realmfall/client-web test -- src/game/worldTerrain.test.ts src/ui/world/worldTerrainConnectivity.test.ts src/ui/world/worldTerrainArt.test.ts`
Expected: PASS

Run: `pnpm --filter @realmfall/client-web build:client:assets`
Expected: PASS

- [ ] **Step 3: Run the broader repository verification path**

Run: `pnpm test`
Expected: PASS

Run: `pnpm build`
Expected: PASS

- [ ] **Step 4: Sync the spec only if implementation clarified an invariant**

```md
- blocker connectivity variants must stay deterministic from immediate hex neighbors
- province-size enforcement applies to sampled surface provinces, not dungeon tiles
```

- [ ] **Step 5: Commit the verification or spec sync changes**

```bash
git add packages/client-web/src/game/worldTerrain.test.ts packages/client-web/src/ui/world/worldTerrainConnectivity.test.ts packages/client-web/src/ui/world/worldTerrainArt.test.ts docs/superpowers/specs/2026-05-12-terrain-rework-design.md
git commit -m "test: verify terrain rework rollout"
```

---

## Self-Review

### Spec coverage

- Province minimum size: covered by Task 2.
- Subtle in-family variants with broad catalog expansion: covered by Tasks 1 and 3.
- Macro mountain and rift structures: covered by Tasks 2 and 4.
- Atlas-backed runtime with deterministic blocker frame selection: covered by Tasks 3 and 4.
- Verification for safe-start, continuity, and atlas coverage: covered by Task 5.

### Placeholder scan

- No `TBD`, `TODO`, or deferred “implement later” language remains in tasks.
- Every code-changing step includes concrete file targets and code snippets.
- Every validation step names the exact command and expected outcome.

### Type consistency

- Core metadata helpers use `getTerrainGameplayFamily`, `TerrainFamilyId`, and `pickProvinceTerrainVariant` consistently across tasks.
- Renderer selection uses `pickConnectedTerrainFrame` consistently across the renderer and tests.
