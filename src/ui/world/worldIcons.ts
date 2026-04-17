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

export const WorldIcons = {
  Player: playerIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  Village: tearTracksIcon,
  Castle: castleIcon,
} as const;

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
const worldIconTextureLoads = new Map<string, Promise<Texture>>();

export function getWorldIconTexture(icon: string) {
  return worldIconTextures.get(icon) ?? Texture.from(icon);
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
