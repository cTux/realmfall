# Terrain Rework Design

Date: 2026-05-12
Status: approved for planning

## Goal

Rework world terrain generation so the map reads as large coherent biome regions instead of per-hex noise, with these outcomes:

- every biome province spans at least 20 connected hexes
- neighboring biome families transition through closer colors and lower contrast
- non-passable terrain art is regenerated and blends with surrounding biomes
- adjacent blocker tiles such as mountains and rifts render as one connected landform instead of isolated per-tile motifs

## Non-Goals

- no broad gameplay rebalance of enemy tables, structure spawns, or progression pacing
- no large persistence-schema rewrite exposed to saves unless the implementation later proves it is required
- no replacement of the existing terrain-atlas runtime model

## User Constraints

- expanded terrain catalog is primarily visual, not gameplay-heavy
- new terrain variants should stay subtle inside each climate family
- mountains, rifts, and similar non-passable tiles should become explicit macro world structures

## Current State

Today `packages/core/src/game/worldTerrain.ts` samples several climate noise fields per hex and resolves directly to a terrain id. The world therefore has no explicit biome-region concept, no minimum region size guarantee, and no feature-level representation for mountain chains or fracture belts.

Today `packages/client-web/scripts/world-terrain-atlas.config.mjs` and the terrain image directory assume one atlas frame per terrain id. The art pipeline supports generated dungeon variants, but surface terrain still behaves like one final image per terrain.

## Proposed Architecture

The rework splits terrain generation into explicit layers while keeping the tile-facing API stable.

### 1. Province Generation

Add a province-generation pass in core that creates large contiguous biome regions before final terrain ids are chosen.

- Provinces are seeded from deterministic low-frequency world fields and seeded region centers.
- Each province has a biome family such as grassland, woodland, wetland, arid, alpine, or corrupted.
- Province growth and merge rules enforce a minimum connected size of 20 hexes.
- Province borders prefer adjacent biome families with compatible palettes so climate transitions stay visually soft.

This layer introduces a first-class concept of macro world structure instead of treating every hex as an isolated climate sample.

### 2. Sub-Biome Variant Assignment

Within each province, assign subtle terrain variants from a family-owned catalog.

- Grassland-like provinces can distribute variants such as plains, meadow, steppe, and new close relatives.
- Woodland-like provinces can distribute grove, forest, and additional low-contrast woodland variants.
- Alpine, arid, wetland, and corrupted families get the same treatment.
- Variant choice uses medium-frequency detail fields, but only inside the family palette chosen by the province pass.

Most new terrain ids remain visual aliases that map back to existing gameplay families. Enemy selection, structure spawning, and other content logic should continue resolving through canonical gameplay terrain-family helpers unless a later implementation task identifies a focused exception.

### 3. Macro Feature Pass

Introduce a separate feature pass for impassable and landmark-like structures.

- Mountains become ranges, ridgelines, massifs, and branch chains generated as connected features.
- Rifts become fracture belts or scar systems instead of isolated blocked hexes.
- Macro features can cross or shape province boundaries and may locally deform province terrain assignment.
- Feature generation should explicitly target continuity so adjacent blocker tiles belong to the same structure graph.

This pass owns world-scale blocker identity and route-shaping behavior.

### 4. Stable Tile API

Tile resolution should continue exposing one resolved terrain id per tile so existing gameplay and rendering entrypoints remain readable.

Internally, generation adds metadata for:

- province id
- biome family id
- sub-biome variant id
- macro feature id
- connectivity descriptor for directional blocker art

The implementation should keep these as generation-owned metadata first. Persisting them into save-facing payloads should be avoided unless tile regeneration and determinism constraints require it.

## Asset Pipeline Design

Replace the current surface-terrain pipeline with recipe-driven generation while preserving the final atlas contract.

### Terrain Family Recipes

Each terrain family gets a recipe definition that controls:

- palette anchors and allowed tint drift
- texture motifs and noise patterns
- vegetation, rock, moisture, and corruption overlays
- edge-blend behavior against compatible neighboring families
- blocker-specific overlays for connected structures

Recipe definitions become the source of truth for generating the expanded terrain catalog.

### Generated Variant Catalog

Generate many more surface terrain images from recipes instead of hand-maintaining one final PNG per terrain.

- Variants inside a family stay visually close to each other.
- Neighboring families use intentionally adjacent palettes to avoid hard contrast jumps.
- Passable and non-passable variants are generated through the same family system so blockers blend with their surrounding biome context.

### Connectivity-Aware Blocker Art

Add directional or connectivity-based art variants for impassable terrain.

Examples:

- mountain ridge-through
- mountain ridge-end
- mountain bend
- mountain fork
- mountain massif
- rift straight
- rift bend
- rift split
- rift terminus

At runtime, terrain resolution remains deterministic. The atlas contains the generated frames, and render-time frame selection uses local neighborhood connectivity derived from the macro feature graph.

## Rendering Model

The Pixi runtime should keep using atlas-backed terrain frames. The change is in how frame ids are authored and selected.

- Standard passable terrain tiles use the resolved sub-biome frame.
- Blocker tiles use a connectivity-aware frame variant that reflects adjacent tiles in the same feature graph.
- If needed for smooth visual boundaries, neighbor-aware border overlays may be generated as additional atlas assets, but the first implementation should prefer keeping the runtime simple and moving as much blending logic as possible into deterministic asset selection.

This keeps render cost controlled and consistent with the current static-layer world rendering rules.

## Data Ownership

Core owns:

- province generation
- sub-biome selection
- macro feature graphs
- terrain-family and gameplay-family mapping helpers

Client asset scripts own:

- recipe definitions
- generated terrain images
- atlas assembly and manifest generation

Client world rendering owns:

- deterministic selection of connectivity-aware terrain art frames
- any narrow neighbor-aware visual selection logic required by the atlas

## Testing Strategy

### Core Generation Tests

Add deterministic tests that cover:

- province minimum size of 20 connected hexes
- broader contiguous biome behavior across multiple seeds
- blocker continuity for mountains and rifts
- stable mapping from visual terrain variants back to canonical gameplay families
- safe-start constraints near origin if those constraints remain after the rework

### Asset Pipeline Tests

Add checks that cover:

- every declared terrain id is emitted into the atlas manifest
- every required blocker connectivity variant is emitted
- atlas generation stays deterministic for the same inputs
- generated family palettes stay within allowed contrast or hue-drift ranges where the test can be made stable

### Rendering Tests

Add focused tests that cover:

- correct atlas frame lookup for expanded terrain ids
- correct connectivity-based variant selection for mountain and rift neighbors
- no regression in deterministic terrain art selection

## Rollout Plan

Roll out in three stages.

### Stage 1: Core Structure

- introduce province and macro feature concepts
- keep a reduced temporary terrain catalog if needed
- land tests for province size and blocker continuity

### Stage 2: Asset Expansion

- add terrain family recipes
- generate the expanded visual terrain catalog
- regenerate non-passable terrain art with province-aware families and connectivity variants
- rebuild the world terrain atlas

### Stage 3: Tuning And Validation

- tune palette adjacency between neighboring families
- tune province frequency, macro feature density, and blocker routing impact
- expand visual and render tests where gaps remain

## Risks And Mitigations

### Risk: Overgrowth In Terrain Taxonomy

Too many terrain ids can make the content layer brittle.

Mitigation:

- keep gameplay-family mapping canonical
- treat most new ids as visual aliases
- avoid duplicating spawn tables per variant

### Risk: Runtime Render Complexity

Neighbor-aware selection can increase static redraw complexity.

Mitigation:

- prefer pre-generated atlas variants over runtime compositing
- keep selection deterministic and local to immediate neighbors
- preserve static-layer caching and avoid per-frame terrain recomposition

### Risk: Province Generation Breaking Existing World Expectations

Safe-start behavior, content distribution, or traversal feel could drift too far.

Mitigation:

- keep origin softening and path-access requirements under explicit tests
- validate blocker density and navigability against sampled seeds before tuning visuals

## Acceptance Criteria

The rework is ready for implementation planning when the plan can target these outcomes:

- biome regions are explicit generation structures with minimum connected size guarantees
- the terrain catalog can expand substantially without demanding gameplay-table duplication
- impassable terrain is generated and rendered as connected macro landforms
- the atlas pipeline can emit the expanded passable and non-passable terrain set deterministically
- tests can verify province size, blocker continuity, and terrain-family stability
