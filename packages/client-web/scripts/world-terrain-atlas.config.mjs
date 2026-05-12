import { SHIPPED_GENERATED_PASSABLE_TERRAIN_SOURCES } from './world-terrain-family-recipes.mjs';

export const WORLD_TERRAIN_ATLAS_COLUMNS = 4;

export const WORLD_TERRAIN_ATLAS_OUTPUTS = {
  image: 'packages/client-web/src/assets/generated/world-terrain-atlas.png',
  manifest: 'packages/client-web/src/assets/generated/world-terrain-atlas.json',
};

const paintedBlockerDir =
  'packages/client-web/src/assets/images/terrain/painted';
function toMountainConnectionMaskString(mask) {
  return Array.from({ length: 6 }, (_, directionIndex) =>
    mask & (1 << directionIndex) ? '1' : '0',
  ).join('');
}

const MOUNTAIN_CONNECTED_TERRAIN_IDS = Array.from(
  { length: 63 },
  (_, index) => `mountain-connect-${toMountainConnectionMaskString(index + 1)}`,
);
const PAINTED_BLOCKER_TERRAIN_IDS = [
  'mountain-isolated',
  ...MOUNTAIN_CONNECTED_TERRAIN_IDS,
  'rift-straight',
  'rift-bend',
  'rift-fork',
  'rift-end',
  'rift-isolated',
  'rift-massif',
];

export const PAINTED_BLOCKER_TERRAIN_SOURCES = PAINTED_BLOCKER_TERRAIN_IDS.map(
  (id) => ({
    id,
    source: `${paintedBlockerDir}/${id}.png`,
  }),
);

export const BASE_WORLD_TERRAIN_ATLAS_SOURCES = [
  {
    id: 'plains',
    source: 'packages/client-web/src/assets/images/terrain/plains-v2.png',
  },
  {
    id: 'meadow',
    source: 'packages/client-web/src/assets/images/terrain/meadow-v2.png',
  },
  {
    id: 'steppe',
    source: 'packages/client-web/src/assets/images/terrain/steppe-v2.png',
  },
  {
    id: 'grove',
    source: 'packages/client-web/src/assets/images/terrain/grove-v2.png',
  },
  {
    id: 'forest',
    source: 'packages/client-web/src/assets/images/terrain/forest-v2.png',
  },
  {
    id: 'marsh',
    source: 'packages/client-web/src/assets/images/terrain/marsh-v2.png',
  },
  {
    id: 'rift',
    source: 'packages/client-web/src/assets/images/terrain/rift-v2.png',
  },
  {
    id: 'blasted',
    source: 'packages/client-web/src/assets/images/terrain/blasted-v2.png',
  },
  {
    id: 'highlands',
    source: 'packages/client-web/src/assets/images/terrain/highlands-v2.png',
  },
  {
    id: 'mountain',
    source: 'packages/client-web/src/assets/images/terrain/mountain-v2.png',
  },
  {
    id: 'dunes',
    source: 'packages/client-web/src/assets/images/terrain/dunes-v2.png',
  },
  {
    id: 'badlands',
    source: 'packages/client-web/src/assets/images/terrain/badlands-v2.png',
  },
  {
    id: 'desert',
    source: 'packages/client-web/src/assets/images/terrain/desert-v2.png',
  },
  {
    id: 'swamp',
    source: 'packages/client-web/src/assets/images/terrain/swamp-v2.png',
  },
  {
    id: 'dungeon-brick-floor',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-brick-floor.png',
  },
  {
    id: 'dungeon-brick-cracked',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-brick-cracked.png',
  },
  {
    id: 'dungeon-brick-moss',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-brick-moss.png',
  },
  {
    id: 'dungeon-brick-wall',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-brick-wall.png',
  },
  {
    id: 'dungeon-mud-floor',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-mud-floor.png',
  },
  {
    id: 'dungeon-mud-rut',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-mud-rut.png',
  },
  {
    id: 'dungeon-mud-puddle',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-mud-puddle.png',
  },
  {
    id: 'dungeon-mud-wall',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-mud-wall.png',
  },
  {
    id: 'dungeon-obsidian-floor',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-obsidian-floor.png',
  },
  {
    id: 'dungeon-obsidian-ash',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-obsidian-ash.png',
  },
  {
    id: 'dungeon-obsidian-ember',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-obsidian-ember.png',
  },
  {
    id: 'dungeon-obsidian-wall',
    source:
      'packages/client-web/src/assets/images/terrain/dungeons/dungeon-obsidian-wall.png',
  },
];

export const WORLD_TERRAIN_ATLAS_SOURCES = [
  ...BASE_WORLD_TERRAIN_ATLAS_SOURCES,
  ...SHIPPED_GENERATED_PASSABLE_TERRAIN_SOURCES.map(({ id, source }) => ({
    id,
    source,
  })),
  ...PAINTED_BLOCKER_TERRAIN_SOURCES,
];
