# Painted Blocker Terrain Design

Date: 2026-05-12
Status: approved for planning

## Goal

Replace the current procedural mountain and rift blocker visuals with hand-authored top-down raster terrain tiles that look like real overhead landforms and connect cleanly across hex edges.

The target outcomes are:

- mountains read as overhead ridge terrain, not symbols or center strokes
- rifts read as fractured corrupted scars, not glowing lines
- every blocker connectivity case used by runtime selection has a dedicated painted source tile
- the existing runtime connectivity model continues choosing the correct tile by neighborhood shape

## Non-Goals

- no gameplay rewrite for blocker passability or terrain ids
- no replacement of the current blocker connectivity classifier unless integration reveals a real mismatch
- no attempt to salvage the current procedural blocker art generator as production output
- no broad redesign of non-blocker biome surfaces in this task

## User Constraints

- mountain tiles should look like real top-down terrain with crest snow and visible rock mass
- every connection shape should receive a beautiful final painted variant
- rifts should match the same quality bar and read as geological fractures with restrained corruption energy
- art should be authored per variant rather than heavily reused through mirroring or aggressive procedural derivation

## Current State

Today blocker selection in `packages/client-web/src/ui/world/worldTerrainConnectivity.ts` can classify mountain and rift neighborhoods into connectivity classes such as `straight`, `bend`, `fork`, `end`, `isolated`, and `massif`. That logic is suitable for runtime selection.

The current blocker asset path is the problem. `packages/client-web/scripts/generate-surface-terrain-variants.mjs` procedurally assembles mountain and rift overlays from SVG geometry. The resulting mountain tiles read as repeated marks or abstract chevrons, and the resulting rifts read as line art instead of terrain.

## Proposed Approach

Replace procedural blocker output with a hand-authored raster blocker set while keeping runtime connectivity selection.

### 1. Canonical Connectivity Set

Keep the existing canonical blocker classes:

- `straight`
- `bend`
- `fork`
- `end`
- `isolated`
- `massif`

These classes remain the runtime vocabulary for both mountains and rifts. If rotation remains visually acceptable for a given class, the renderer may keep rotating that class. If a painted variant depends on a fixed directional composition, the art set should expand to direction-specific finals instead of forcing a bad rotation.

### 2. Mountain Art Direction

Every mountain tile should be painted as overhead terrain, not iconography.

Required mountain visual traits:

- broad rocky shoulder mass spanning the connecting tile edges
- crest snow located on the highest ridgeline rather than as repeated triangle marks
- darker lee-side rock and shadow mass that helps the landform read from above
- broken stone texture integrated into the terrain body
- silhouette continuity that makes neighboring mountain tiles read as one ridge chain

The visual model is a top-down ridge or massif, where each connectivity class describes how the ridge body enters and exits the hex rather than which glyph to stamp in the center.

### 3. Rift Art Direction

Every rift tile should be painted as torn terrain with corruption inside the fracture.

Required rift visual traits:

- broken rock lips and fractured banks along the scar
- dark depth in the crack body
- restrained inner corruption glow instead of a bright neon stripe
- connection continuity to neighboring edges so adjacent rift tiles read as one fracture system
- enough ground texture around the fracture that the tile reads as damaged terrain rather than a pure effect layer

The rift should look half geological and half corrupted, with the physical tear remaining dominant.

### 4. Asset Ownership

Blocker tiles should stop being generated as final production art by `generate-surface-terrain-variants.mjs`.

Instead:

- hand-authored final mountain and rift PNGs become the source of truth
- these finals live in the terrain asset tree as checked-in production assets
- the atlas build script packs them directly
- the procedural script may remain for passable subtle-variant surfaces, but blocker finals should leave that path

This cleanly separates two different asset classes:

- subtle recipe-driven biome surfaces
- painted blocker terrain finals

## Asset Set

### Mountains

Required painted finals:

- `mountain-straight`
- `mountain-bend`
- `mountain-fork`
- `mountain-end`
- `mountain-isolated`
- `mountain-massif`

Optional follow-up expansion if rotation degrades readability:

- direction-specific versions for one or more of the classes above

### Rifts

Required painted finals:

- `rift-straight`
- `rift-bend`
- `rift-fork`
- `rift-end`
- `rift-isolated`
- `rift-massif`

Optional follow-up expansion if rotation degrades readability:

- direction-specific versions for one or more of the classes above

## Runtime Integration

The selection model should remain simple.

- `worldTerrainConnectivity.ts` keeps classifying the local neighborhood
- `worldTerrainArt.ts` resolves the chosen blocker frame id from the painted asset set
- the static world renderer uses that painted frame instead of a procedurally generated blocker output
- token invalidation must continue accounting for neighbor-dependent presentation so cached layers redraw when blocker adjacency changes

The implementation should not add per-frame composition logic for blockers. Visual complexity should live in the authored assets, not in runtime layer stacking.

## Asset Pipeline Changes

### Remove Blockers From Procedural Final Output

`packages/client-web/scripts/generate-surface-terrain-variants.mjs` should no longer be the final source of blocker art. Any blocker-specific logic there should either be removed or converted into a fallback or concept-only path that the runtime atlas no longer consumes.

### Pack Painted Finals Into Atlas

`packages/client-web/scripts/world-terrain-atlas.config.mjs` and the atlas build path should point mountain and rift entries at the checked-in painted finals.

The atlas manifest remains the public runtime contract. The key change is only which input PNGs feed those frame ids.

## Testing Strategy

### Runtime Selection Tests

Keep deterministic tests for:

- mountain connectivity classification
- rift connectivity classification
- chosen painted frame id for each canonical topology
- any rotation mapping that remains in use

### Asset Presence Tests

Add or update checks that ensure:

- every painted blocker variant exists on disk
- every required blocker variant is included in the atlas manifest
- atlas generation fails fast when a painted blocker source is missing

### Manual Visual Verification

Manual in-game verification is required for this task because the main success criterion is perceptual.

Required manual checks:

- a mountain chain reads as one connected ridgeline across neighboring hexes
- a mountain bend reads as one turning ridge body
- a massif reads as a broader cluster rather than a stretched single ridge
- a rift chain reads as one fractured scar system
- blockers remain readable under world lighting and weather overlays

## Risks And Mitigations

### Risk: Rotation Breaks The Painted Illusion

Some painted variants may look wrong when rotated.

Mitigation:

- allow direction-specific finals where rotation hurts readability
- keep runtime support for canonical classes first, then widen only the shapes that need it

### Risk: Mixed Provenance In Terrain Assets

Using procedural surfaces and hand-painted blockers can create maintenance confusion.

Mitigation:

- document blockers as a separate production asset class
- keep atlas configuration explicit about which blocker frames come from checked-in painted finals

### Risk: In-Game Readability At Small Scale

Beautiful large tiles can fail once scaled into the world renderer.

Mitigation:

- verify tiles at real runtime scale early
- bias toward larger landform masses and simpler crest shapes over fine detail

## Rollout

### Stage 1: Paint Canonical Finals

- create the full painted canonical mountain set
- create the full painted canonical rift set
- normalize tile framing, silhouette continuity, and palette discipline

### Stage 2: Atlas Integration

- remove blocker finals from the procedural generation path
- wire the atlas to the painted blocker tiles
- keep runtime connectivity selection stable

### Stage 3: In-Game Tuning

- verify the painted blockers under actual world rendering conditions
- adjust any variant that fails to read at game scale
- expand to direction-specific finals only where rotation visibly breaks the illusion
