import playerIcon from '../../assets/icons/visored-helm.svg';
import sunCloudIcon from '../../assets/icons/sun-cloud.svg';
import rainingIcon from '../../assets/icons/raining.svg';
import snowingIcon from '../../assets/icons/snowing.svg';
import tearTracksIcon from '../../assets/icons/tear-tracks.svg';
import castleIcon from '../../assets/icons/castle.svg';
import { ENEMY_CONFIGS, getEnemyConfig } from '../../game/content/enemies';
import {
  STRUCTURE_CONFIGS,
  getStructureConfig,
} from '../../game/content/structures';
import type { Enemy, GameState, StructureType, Tile } from '../../game/state';
import { ImageSource, Texture } from 'pixi.js';
import { RARITY_COLOR } from '../rarity';

export const WorldIcons = {
  Player: playerIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  Village: tearTracksIcon,
  Castle: castleIcon,
} as const;

const ENEMY_RARITY_TINTS = Object.fromEntries(
  Object.entries(RARITY_COLOR).map(([rarity, color]) => [
    rarity,
    Number.parseInt(color.slice(1), 16),
  ]),
) as Record<keyof typeof RARITY_COLOR, number>;

export function enemyIconFor(
  enemy: Pick<Enemy, 'enemyTypeId' | 'name'> | string,
) {
  const lookup =
    typeof enemy === 'string' ? enemy : (enemy.enemyTypeId ?? enemy.name);
  return (
    getEnemyConfig(lookup)?.icon ??
    getEnemyConfig('wolf')?.icon ??
    WorldIcons.Player
  );
}

export function enemyIconTintFor(
  enemy: Pick<Enemy, 'enemyTypeId' | 'name' | 'rarity'> | string,
) {
  if (typeof enemy !== 'string') {
    return ENEMY_RARITY_TINTS[enemy.rarity ?? 'common'];
  }

  return getEnemyConfig(enemy)?.tint ?? 0xef4444;
}

export function structureIconFor(structure: StructureType) {
  return getStructureConfig(structure).icon;
}

export function getWorldIconAssetIds() {
  return Array.from(
    new Set([
      ...getCoreWorldIconAssetIds(),
      ...ENEMY_CONFIGS.map((config) => config.icon),
      ...STRUCTURE_CONFIGS.map((config) => config.icon),
    ]),
  );
}

export function getCoreWorldIconAssetIds() {
  return Object.values(WorldIcons);
}

export function getVisibleWorldIconAssetIds(
  game: Pick<GameState, 'enemies'>,
  visibleTiles: Tile[],
) {
  const iconAssetIds = new Set(getCoreWorldIconAssetIds());

  for (const tile of visibleTiles) {
    if (tile.structure) {
      iconAssetIds.add(
        tile.structure === 'town' && tile.claim?.ownerType === 'faction'
          ? WorldIcons.Castle
          : structureIconFor(tile.structure),
      );
    }

    if (tile.claim?.npc?.enemyId) {
      iconAssetIds.add(WorldIcons.Village);
    }

    for (const enemyId of tile.enemyIds) {
      const enemy = game.enemies[enemyId];
      if (enemy) {
        iconAssetIds.add(enemyIconFor(enemy));
      }
    }
  }

  return [...iconAssetIds];
}

const worldIconTextures = new Map<string, Texture>();
const worldIconTestFallbackTextures = new Map<string, Texture>();
const worldIconTextureLoads = new Map<string, Promise<Texture>>();
let worldIconTextureVersion = 0;

export function getWorldIconTexture(icon: string) {
  if (worldIconTextures.has(icon)) {
    return worldIconTextures.get(icon)!;
  }

  if (/jsdom/i.test(globalThis.navigator?.userAgent ?? '')) {
    const fallbackTexture = worldIconTestFallbackTextures.get(icon);
    if (fallbackTexture) {
      return fallbackTexture;
    }

    const texture = Texture.from(icon);
    worldIconTestFallbackTextures.set(icon, texture);
    return texture;
  }

  throw new Error(`World icon texture requested before preload: ${icon}`);
}

export function getWorldIconTextureVersion() {
  return worldIconTextureVersion;
}

export function ensureWorldIconTexturesLoaded(
  iconAssetIds = getWorldIconAssetIds(),
) {
  if (
    typeof window === 'undefined' ||
    typeof Image === 'undefined' ||
    /jsdom/i.test(globalThis.navigator?.userAgent ?? '')
  ) {
    return Promise.resolve();
  }

  return Promise.all(
    iconAssetIds.map((icon) => loadWorldIconTexture(icon)),
  ).then(() => undefined);
}

function loadWorldIconTexture(icon: string) {
  const existing = worldIconTextures.get(icon);
  if (existing) {
    return Promise.resolve(existing);
  }

  const inFlight = worldIconTextureLoads.get(icon);
  if (inFlight) {
    return inFlight;
  }

  const textureLoad = new Promise<Texture>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const texture = new Texture({
        source: new ImageSource({
          resource: image,
        }),
      });
      worldIconTextureLoads.delete(icon);
      worldIconTextures.set(icon, texture);
      worldIconTextureVersion =
        worldIconTextureVersion >= Number.MAX_SAFE_INTEGER
          ? 1
          : worldIconTextureVersion + 1;
      resolve(texture);
    };
    image.onerror = () => {
      worldIconTextureLoads.delete(icon);
      reject(new Error(`Failed to load world icon texture: ${icon}`));
    };
    image.src = icon;
  });

  worldIconTextureLoads.set(icon, textureLoad);
  return textureLoad;
}
