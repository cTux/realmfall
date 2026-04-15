import playerIcon from '../../assets/icons/visored-helm.svg';
import sunCloudIcon from '../../assets/icons/sun-cloud.svg';
import rainingIcon from '../../assets/icons/raining.svg';
import snowingIcon from '../../assets/icons/snowing.svg';
import tearTracksIcon from '../../assets/icons/tear-tracks.svg';
import { ENEMY_CONFIGS, getEnemyConfig } from '../../game/content/enemies';
import {
  STRUCTURE_CONFIGS,
  getStructureConfig,
} from '../../game/content/structures';
import type { Enemy, StructureType } from '../../game/state';
import { ImageSource, Texture } from 'pixi.js';

export const WorldIcons = {
  Player: playerIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  Village: tearTracksIcon,
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
      ...Object.values(WorldIcons),
      ...ENEMY_CONFIGS.map((config) => config.icon),
      ...STRUCTURE_CONFIGS.map((config) => config.icon),
    ]),
  );
}

const worldIconTextures = new Map<string, Texture>();
let worldIconPreloadPromise: Promise<void> | null = null;

export function getWorldIconTexture(icon: string) {
  return worldIconTextures.get(icon) ?? Texture.from(icon);
}

export function ensureWorldIconTexturesLoaded() {
  if (worldIconPreloadPromise) {
    return worldIconPreloadPromise;
  }

  if (
    typeof window === 'undefined' ||
    typeof Image === 'undefined' ||
    /jsdom/i.test(globalThis.navigator?.userAgent ?? '')
  ) {
    worldIconPreloadPromise = Promise.resolve();
    return worldIconPreloadPromise;
  }

  worldIconPreloadPromise = Promise.all(
    getWorldIconAssetIds().map((icon) => loadWorldIconTexture(icon)),
  ).then(() => undefined);

  return worldIconPreloadPromise;
}

function loadWorldIconTexture(icon: string) {
  const existing = worldIconTextures.get(icon);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise<Texture>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const texture = new Texture({
        source: new ImageSource({
          resource: image,
        }),
      });
      worldIconTextures.set(icon, texture);
      resolve(texture);
    };
    image.onerror = () => {
      reject(new Error(`Failed to load world icon texture: ${icon}`));
    };
    image.src = icon;
  });
}
