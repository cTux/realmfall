# Painted Blocker Terrain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the procedural mountain and rift blocker visuals with hand-authored top-down raster tiles for every runtime connectivity class and wire those tiles into the world terrain atlas.

**Architecture:** Keep the current neighborhood connectivity classifier and static world rendering path, but swap the blocker asset source from procedural SVG overlays to checked-in painted raster finals. Mountains and rifts become explicit production assets, while runtime only selects the correct class and orientation.

**Tech Stack:** TypeScript, Vitest, Node.js atlas scripts, Sharp, Pixi terrain atlas rendering, pnpm workspaces, raster blocker art assets

---

## File Structure

### Blocker asset source

- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-straight.png`
  Responsibility: top-down painted ridge tile for the straight mountain connectivity class.
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-bend.png`
  Responsibility: top-down painted ridge tile for the bend mountain connectivity class.
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-fork.png`
  Responsibility: top-down painted ridge tile for the fork mountain connectivity class.
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-end.png`
  Responsibility: top-down painted ridge tile for the end mountain connectivity class.
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-isolated.png`
  Responsibility: top-down painted tile for a standalone mountain blocker.
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-massif.png`
  Responsibility: top-down painted tile for a broader mountain cluster.
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-straight.png`
  Responsibility: painted fractured corrupted scar tile for the straight rift connectivity class.
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-bend.png`
  Responsibility: painted fractured corrupted scar tile for the bend rift connectivity class.
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-fork.png`
  Responsibility: painted fractured corrupted scar tile for the fork rift connectivity class.
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-end.png`
  Responsibility: painted fractured corrupted scar tile for the end rift connectivity class.
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-isolated.png`
  Responsibility: painted standalone corrupted scar tile.
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-massif.png`
  Responsibility: painted broader fractured corrupted cluster tile.

### Atlas and script integration

- Modify: `packages/client-web/scripts/world-terrain-family-recipes.mjs`
  Responsibility: stop routing blocker finals through the procedural generated-surface recipe path.
- Modify: `packages/client-web/scripts/generate-surface-terrain-variants.mjs`
  Responsibility: remove or neutralize blocker-final generation so the script only owns non-blocker generated surfaces.
- Modify: `packages/client-web/scripts/world-terrain-atlas.config.mjs`
  Responsibility: point mountain and rift atlas frames at the checked-in painted blocker finals.
- Modify: `packages/client-web/scripts/build-world-terrain-atlas.mjs`
  Responsibility: fail fast when required painted blocker assets are missing.

### Runtime selection and tests

- Modify: `packages/client-web/src/ui/world/worldTerrainArt.ts`
  Responsibility: keep atlas frame resolution aligned with the new blocker asset inputs.
- Modify: `packages/client-web/src/ui/world/worldTerrainConnectivity.ts`
  Responsibility: keep only the connectivity and rotation logic needed by the painted set, removing any assumptions tied to procedural blocker geometry if present.
- Modify: `packages/client-web/src/ui/world/worldTerrainConnectivity.test.ts`
  Responsibility: cover blocker class selection against the painted asset ids.
- Modify: `packages/client-web/src/ui/world/worldTerrainArt.test.ts`
  Responsibility: cover atlas lookup for the painted blocker frames.

### Visual reference handling

- Create: `packages/client-web/src/assets/images/terrain/painted/reference/`
  Responsibility: optional workspace-local staging area for concept or intermediate blocker art used to produce the final tiles. This directory should not be packed into the runtime atlas.

### Verification commands

- `pnpm --filter @realmfall/client-web build:client:assets`
- `pnpm --filter @realmfall/client-web test -- src/ui/world/worldTerrainConnectivity.test.ts src/ui/world/worldTerrainArt.test.ts`
- `pnpm --filter @realmfall/client-web typecheck`
- `pnpm --filter @realmfall/client-web build`

---

### Task 1: Freeze The Blocker Asset Contract

**Files:**

- Modify: `packages/client-web/scripts/world-terrain-family-recipes.mjs`
- Modify: `packages/client-web/scripts/world-terrain-atlas.config.mjs`
- Modify: `packages/client-web/scripts/build-world-terrain-atlas.mjs`
- Test: `packages/client-web/src/ui/world/worldTerrainArt.test.ts`

- [ ] **Step 1: Write the failing atlas-source test**

```ts
it('requires painted blocker terrain files for every canonical connectivity class', () => {
  expect(getWorldTerrainFrameId('mountain-straight')).toContain(
    'mountain-straight',
  );
  expect(getWorldTerrainFrameId('mountain-bend')).toContain('mountain-bend');
  expect(getWorldTerrainFrameId('mountain-fork')).toContain('mountain-fork');
  expect(getWorldTerrainFrameId('mountain-end')).toContain('mountain-end');
  expect(getWorldTerrainFrameId('mountain-isolated')).toContain(
    'mountain-isolated',
  );
  expect(getWorldTerrainFrameId('mountain-massif')).toContain(
    'mountain-massif',
  );
  expect(getWorldTerrainFrameId('rift-straight')).toContain('rift-straight');
  expect(getWorldTerrainFrameId('rift-bend')).toContain('rift-bend');
  expect(getWorldTerrainFrameId('rift-fork')).toContain('rift-fork');
  expect(getWorldTerrainFrameId('rift-end')).toContain('rift-end');
  expect(getWorldTerrainFrameId('rift-isolated')).toContain('rift-isolated');
  expect(getWorldTerrainFrameId('rift-massif')).toContain('rift-massif');
});
```

- [ ] **Step 2: Run the narrow test to confirm current blocker ownership is wrong**

Run: `pnpm --filter @realmfall/client-web test -- src/ui/world/worldTerrainArt.test.ts`
Expected: PASS or FAIL is acceptable here, but inspect the current atlas source wiring and note that blocker frames still come from the procedural path rather than checked-in painted finals.

- [ ] **Step 3: Update the atlas config to point blocker ids at painted-source paths**

```js
// packages/client-web/scripts/world-terrain-atlas.config.mjs
const paintedBlockerDir =
  'packages/client-web/src/assets/images/terrain/painted';

export const WORLD_TERRAIN_ATLAS_SOURCES = [
  // keep existing passable terrain entries
  {
    id: 'mountain-straight',
    source: `${paintedBlockerDir}/mountain-straight.png`,
  },
  {
    id: 'mountain-bend',
    source: `${paintedBlockerDir}/mountain-bend.png`,
  },
  {
    id: 'mountain-fork',
    source: `${paintedBlockerDir}/mountain-fork.png`,
  },
  {
    id: 'mountain-end',
    source: `${paintedBlockerDir}/mountain-end.png`,
  },
  {
    id: 'mountain-isolated',
    source: `${paintedBlockerDir}/mountain-isolated.png`,
  },
  {
    id: 'mountain-massif',
    source: `${paintedBlockerDir}/mountain-massif.png`,
  },
  {
    id: 'rift-straight',
    source: `${paintedBlockerDir}/rift-straight.png`,
  },
  {
    id: 'rift-bend',
    source: `${paintedBlockerDir}/rift-bend.png`,
  },
  {
    id: 'rift-fork',
    source: `${paintedBlockerDir}/rift-fork.png`,
  },
  {
    id: 'rift-end',
    source: `${paintedBlockerDir}/rift-end.png`,
  },
  {
    id: 'rift-isolated',
    source: `${paintedBlockerDir}/rift-isolated.png`,
  },
  {
    id: 'rift-massif',
    source: `${paintedBlockerDir}/rift-massif.png`,
  },
];
```

- [ ] **Step 4: Make atlas validation fail fast on missing painted blocker sources**

```js
// packages/client-web/scripts/build-world-terrain-atlas.mjs
for (const entry of WORLD_TERRAIN_ATLAS_SOURCES) {
  await ensureFileExists(
    join(rootDir, entry.source),
    `World terrain atlas source is missing: ${entry.id} -> ${entry.source}`,
  );
}
```

- [ ] **Step 5: Run the asset build and expect it to fail until painted sources exist**

Run: `pnpm --filter @realmfall/client-web build:client:assets`
Expected: FAIL with a missing-file error for the first painted blocker source.

- [ ] **Step 6: Commit the contract-only change**

```bash
git add packages/client-web/scripts/world-terrain-family-recipes.mjs packages/client-web/scripts/world-terrain-atlas.config.mjs packages/client-web/scripts/build-world-terrain-atlas.mjs packages/client-web/src/ui/world/worldTerrainArt.test.ts
git commit -m "refactor: route blockers to painted atlas sources"
```

---

### Task 2: Produce The Painted Mountain Variant Set

**Files:**

- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-straight.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-bend.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-fork.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-end.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-isolated.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/mountain-massif.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/reference/`
- Verify: manual image review plus asset build

- [ ] **Step 1: Generate or paint a single reference mountain sheet outside the atlas path**

Create a concept sheet that shows all six mountain classes in one consistent top-down style:

- straight ridge
- bend ridge
- fork ridge
- end ridge
- isolated mountain
- massif cluster

The image should emphasize broad rocky shoulders, crest snow, darker lee-side rock, and edge-to-edge continuity.

- [ ] **Step 2: Slice or repaint each mountain class into its final tile file**

Create six final 200x200 PNG tiles:

```text
packages/client-web/src/assets/images/terrain/painted/mountain-straight.png
packages/client-web/src/assets/images/terrain/painted/mountain-bend.png
packages/client-web/src/assets/images/terrain/painted/mountain-fork.png
packages/client-web/src/assets/images/terrain/painted/mountain-end.png
packages/client-web/src/assets/images/terrain/painted/mountain-isolated.png
packages/client-web/src/assets/images/terrain/painted/mountain-massif.png
```

Constraints:

- top-down only
- no icon-like triangles or chevrons
- crest snow follows the high ridge
- the landform reaches the edges required by the connectivity class
- detail stays readable at game scale

- [ ] **Step 3: Run the atlas build and inspect the mountain outputs**

Run: `pnpm --filter @realmfall/client-web build:client:assets`
Expected: PASS for the mountain inputs that now exist, while rifts may remain missing until Task 3.

- [ ] **Step 4: Review the mountain tiles at runtime scale**

Inspect:

- the source PNGs in `packages/client-web/src/assets/images/terrain/painted/`
- the packed atlas output in `packages/client-web/src/assets/generated/world-terrain-atlas.png`

Acceptance criteria:

- no repeated symbol pattern
- mountain mass is readable at small scale
- edge continuity is obvious

- [ ] **Step 5: Commit the mountain set**

```bash
git add packages/client-web/src/assets/images/terrain/painted/mountain-straight.png packages/client-web/src/assets/images/terrain/painted/mountain-bend.png packages/client-web/src/assets/images/terrain/painted/mountain-fork.png packages/client-web/src/assets/images/terrain/painted/mountain-end.png packages/client-web/src/assets/images/terrain/painted/mountain-isolated.png packages/client-web/src/assets/images/terrain/painted/mountain-massif.png
git commit -m "feat: add painted mountain blocker tiles"
```

---

### Task 3: Produce The Painted Rift Variant Set

**Files:**

- Create: `packages/client-web/src/assets/images/terrain/painted/rift-straight.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-bend.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-fork.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-end.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-isolated.png`
- Create: `packages/client-web/src/assets/images/terrain/painted/rift-massif.png`
- Verify: manual image review plus asset build

- [ ] **Step 1: Generate or paint a single reference rift sheet outside the atlas path**

Create a concept sheet that shows all six rift classes in one consistent style:

- straight fracture
- bend fracture
- fork fracture
- end fracture
- isolated scar
- massif or cluster fracture

The image should emphasize broken rock lips, dark depth, and restrained corruption glow.

- [ ] **Step 2: Slice or repaint each rift class into its final tile file**

Create six final 200x200 PNG tiles:

```text
packages/client-web/src/assets/images/terrain/painted/rift-straight.png
packages/client-web/src/assets/images/terrain/painted/rift-bend.png
packages/client-web/src/assets/images/terrain/painted/rift-fork.png
packages/client-web/src/assets/images/terrain/painted/rift-end.png
packages/client-web/src/assets/images/terrain/painted/rift-isolated.png
packages/client-web/src/assets/images/terrain/painted/rift-massif.png
```

Constraints:

- the physical crack remains dominant
- corruption glow stays secondary
- the fracture reaches the edges required by the connectivity class
- the tile reads as damaged terrain, not an effect stamp

- [ ] **Step 3: Run the atlas build with the full blocker set**

Run: `pnpm --filter @realmfall/client-web build:client:assets`
Expected: PASS with all painted blocker sources present and packed.

- [ ] **Step 4: Review the rift tiles at runtime scale**

Inspect:

- the source PNGs in `packages/client-web/src/assets/images/terrain/painted/`
- the packed atlas output in `packages/client-web/src/assets/generated/world-terrain-atlas.png`

Acceptance criteria:

- no center-line look
- fractured banks remain readable
- glow does not overpower the terrain read

- [ ] **Step 5: Commit the rift set**

```bash
git add packages/client-web/src/assets/images/terrain/painted/rift-straight.png packages/client-web/src/assets/images/terrain/painted/rift-bend.png packages/client-web/src/assets/images/terrain/painted/rift-fork.png packages/client-web/src/assets/images/terrain/painted/rift-end.png packages/client-web/src/assets/images/terrain/painted/rift-isolated.png packages/client-web/src/assets/images/terrain/painted/rift-massif.png packages/client-web/src/assets/generated/world-terrain-atlas.png packages/client-web/src/assets/generated/world-terrain-atlas.json
git commit -m "feat: add painted rift blocker tiles"
```

---

### Task 4: Remove Procedural Blocker Finals From The Surface Generator

**Files:**

- Modify: `packages/client-web/scripts/world-terrain-family-recipes.mjs`
- Modify: `packages/client-web/scripts/generate-surface-terrain-variants.mjs`
- Test: `pnpm --filter @realmfall/client-web build:client:assets`

- [ ] **Step 1: Write the failing script expectation**

Document the intended invariant in code comments or testable config shape:

```js
const BLOCKER_TERRAIN_IDS = new Set([
  'mountain-straight',
  'mountain-bend',
  'mountain-fork',
  'mountain-end',
  'mountain-isolated',
  'mountain-massif',
  'rift-straight',
  'rift-bend',
  'rift-fork',
  'rift-end',
  'rift-isolated',
  'rift-massif',
]);
```

- [ ] **Step 2: Remove blocker-final entries from the generated-surface recipe output**

Update the recipe and generator code so blocker finals are no longer emitted under `src/assets/images/terrain/generated/` as production atlas inputs.

Expected end state:

- generated surfaces continue for subtle passable terrain variants
- blocker ids come only from `src/assets/images/terrain/painted/`

- [ ] **Step 3: Re-run the asset build to verify the atlas is stable without procedural blocker output**

Run: `pnpm --filter @realmfall/client-web build:client:assets`
Expected: PASS with the atlas packed entirely from painted blocker finals for mountains and rifts.

- [ ] **Step 4: Commit the generator cleanup**

```bash
git add packages/client-web/scripts/world-terrain-family-recipes.mjs packages/client-web/scripts/generate-surface-terrain-variants.mjs
git commit -m "refactor: remove procedural blocker finals"
```

---

### Task 5: Verify Runtime Selection Against The Painted Set

**Files:**

- Modify: `packages/client-web/src/ui/world/worldTerrainConnectivity.test.ts`
- Modify: `packages/client-web/src/ui/world/worldTerrainArt.test.ts`
- Modify: `packages/client-web/src/ui/world/worldTerrainConnectivity.ts` if any art-driven rotation adjustments are required
- Verify: build, tests, and manual in-game screenshots

- [ ] **Step 1: Add connectivity assertions for the painted blocker ids**

```ts
it('selects the painted mountain blocker frame for a straight chain', () => {
  const presentation = getConnectedWorldTerrainPresentation(
    makeVisibleTile('mountain', [0, 3]),
    makeVisibleTileMapForDirections('mountain', [0, 3]),
  );

  expect(presentation.terrainId).toBe('mountain-straight');
});

it('selects the painted rift blocker frame for a bend chain', () => {
  const presentation = getConnectedWorldTerrainPresentation(
    makeVisibleTile('rift', [0, 1]),
    makeVisibleTileMapForDirections('rift', [0, 1]),
  );

  expect(presentation.terrainId).toBe('rift-bend');
});
```

- [ ] **Step 2: Run the focused renderer tests**

Run: `pnpm --filter @realmfall/client-web test -- src/ui/world/worldTerrainConnectivity.test.ts src/ui/world/worldTerrainArt.test.ts`
Expected: PASS with the same class mapping as before, now backed by the painted asset ids.

- [ ] **Step 3: Run typecheck and production build**

Run: `pnpm --filter @realmfall/client-web typecheck`
Expected: PASS

Run: `pnpm --filter @realmfall/client-web build`
Expected: PASS

- [ ] **Step 4: Perform manual in-game verification**

Check representative world layouts that include:

- mountain straight chain
- mountain bend
- mountain massif
- rift straight chain
- rift fork
- rift massif

Acceptance criteria:

- blocker chains read as one landform or fracture system
- runtime scale preserves readability
- weather and overlay effects do not destroy the terrain read

- [ ] **Step 5: Commit the runtime verification updates**

```bash
git add packages/client-web/src/ui/world/worldTerrainConnectivity.test.ts packages/client-web/src/ui/world/worldTerrainArt.test.ts packages/client-web/src/ui/world/worldTerrainConnectivity.ts packages/client-web/src/assets/generated/world-terrain-atlas.png packages/client-web/src/assets/generated/world-terrain-atlas.json
git commit -m "feat: integrate painted blocker terrain"
```
