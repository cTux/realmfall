import playerIcon from '../../assets/icons/visored-helm.svg';
import sunCloudIcon from '../../assets/icons/sun-cloud.svg';
import rainingIcon from '../../assets/icons/raining.svg';
import snowingIcon from '../../assets/icons/snowing.svg';
import tearTracksIcon from '../../assets/icons/tear-tracks.svg';
import castleIcon from '../../assets/icons/castle.svg';
import batIcon from '../../assets/game-icons/delapouite/bat.svg';
import forgottenLootIcon from '../../assets/game-icons/lorc/swap-bag.svg';
import unknownHexIcon from '../../assets/game-icons/delapouite/perspective-dice-six-faces-random.svg';
import { ENEMY_CONFIGS, getEnemyConfig } from '../../game/content/enemies';
import {
  STRUCTURE_CONFIGS,
  getStructureConfig,
} from '../../game/content/structures';
import { hexDistance, hexesInRange } from '../../game/hex';
import { getEnemiesAt, getTileAt } from '../../game/stateWorldQueries';
import type { Enemy, GameState, StructureType } from '../../game/stateTypes';
import { ImageSource, Rectangle, Texture } from 'pixi.js';
import { RARITY_COLOR } from '../rarity';
import {
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';
import {
  getWorldTerrainAssetIds,
  getWorldTerrainAtlasImage,
  getWorldTerrainFrame,
  isWorldTerrainFrameId,
  terrainArtFor,
  type WorldTerrainAtlasFrameId,
} from './worldTerrainArt';

const WORLD_ICON_BACKGROUND_WARMUP_BATCH_SIZE = 4;
const WORLD_ICON_WARMUP_FALLBACK_SLICE_MS = 8;

export const WorldIcons = {
  Player: playerIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  Bat: batIcon,
  Village: tearTracksIcon,
  Castle: castleIcon,
  ForgottenLoot: forgottenLootIcon,
  UnknownHex: unknownHexIcon,
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
  const enemyTypeId = typeof enemy === 'string' ? enemy : enemy.enemyTypeId;
  return (
    (enemyTypeId ? getEnemyConfig(enemyTypeId)?.icon : undefined) ??
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
      ...getWorldTerrainAssetIds(),
      ...ENEMY_CONFIGS.map((config) => config.icon),
      ...STRUCTURE_CONFIGS.map((config) => config.icon),
    ]),
  );
}

export function getCoreWorldIconAssetIds() {
  return Object.values(WorldIcons);
}

export function getVisibleWorldIconAssetIds(
  enemyLookup: Record<string, Enemy | undefined>,
  visibleTiles: VisibleWorldTile[],
) {
  return [
    ...collectWorldIconAssetIdsForTiles({
      iconAssetIds: new Set(getCoreWorldIconAssetIds()),
      resolveEnemies: (tile) =>
        tile.enemyIds
          .map((enemyId) => enemyLookup[enemyId])
          .filter((enemy): enemy is Enemy => enemy !== undefined),
      tiles: visibleTiles,
    }),
  ];
}

export function getReachableWorldIconAssetIds(
  state: Pick<
    GameState,
    'bloodMoonActive' | 'enemies' | 'player' | 'radius' | 'seed' | 'tiles'
  >,
) {
  const reachableTiles = hexesInRange(state.player.coord, state.radius + 1)
    .filter(
      (coord) => hexDistance(state.player.coord, coord) === state.radius + 1,
    )
    .map((coord) => getTileAt(state, coord));

  return [
    ...collectWorldIconAssetIdsForTiles({
      iconAssetIds: new Set<string>(),
      resolveEnemies: (tile) => getEnemiesAt(state, tile.coord),
      tiles: reachableTiles,
    }),
  ];
}

const worldIconTextures = new Map<string, Texture>();
const worldIconTestFallbackTextures = new Map<string, Texture>();
const worldIconTextureLoads = new Map<string, Promise<Texture>>();
const queuedWorldIconWarmups = new Set<string>();
const worldIconWarmupQueue: string[] = [];
let worldIconWarmupHandle: number | null = null;
let worldIconPlaceholderTexture: Texture | null = null;
let worldIconTextureVersion = 0;
let worldTerrainAtlasBaseTexture: Texture | null = null;
let worldTerrainAtlasBaseTextureLoad: Promise<Texture> | null = null;

export function getWorldIconTexture(
  icon: string,
  options?: { allowPending?: boolean },
) {
  const cachedTexture = takeValidWorldIconTexture(worldIconTextures, icon);
  if (cachedTexture) {
    return cachedTexture;
  }

  if (/jsdom/i.test(globalThis.navigator?.userAgent ?? '')) {
    const fallbackTexture = takeValidWorldIconTexture(
      worldIconTestFallbackTextures,
      icon,
    );
    if (fallbackTexture) {
      return fallbackTexture;
    }

    const texture = Texture.from(icon);
    worldIconTestFallbackTextures.set(icon, texture);
    return texture;
  }

  if (options?.allowPending) {
    void loadWorldIconTexture(icon).catch(() => undefined);
    return getWorldIconPlaceholderTexture();
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

export function warmWorldIconTexturesInBackground(
  iconAssetIds = getWorldIconAssetIds(),
) {
  if (
    typeof window === 'undefined' ||
    typeof Image === 'undefined' ||
    /jsdom/i.test(globalThis.navigator?.userAgent ?? '')
  ) {
    return;
  }

  for (const icon of iconAssetIds) {
    if (
      worldIconTextures.has(icon) ||
      worldIconTextureLoads.has(icon) ||
      queuedWorldIconWarmups.has(icon)
    ) {
      continue;
    }

    queuedWorldIconWarmups.add(icon);
    worldIconWarmupQueue.push(icon);
  }

  scheduleWorldIconWarmup();
}

function loadWorldIconTexture(icon: string) {
  const existing = takeValidWorldIconTexture(worldIconTextures, icon);
  if (existing) {
    return Promise.resolve(existing);
  }

  const inFlight = worldIconTextureLoads.get(icon);
  if (inFlight) {
    return inFlight;
  }

  const textureLoad = (
    isWorldTerrainFrameId(icon)
      ? loadWorldTerrainAtlasFrameTexture(icon)
      : loadStandaloneWorldIconTexture(icon)
  )
    .then((texture) => {
      worldIconTextures.set(icon, texture);
      worldIconTextureVersion =
        worldIconTextureVersion >= Number.MAX_SAFE_INTEGER
          ? 1
          : worldIconTextureVersion + 1;
      return texture;
    })
    .finally(() => {
      worldIconTextureLoads.delete(icon);
    });

  worldIconTextureLoads.set(icon, textureLoad);
  return textureLoad;
}

function collectWorldIconAssetIdsForTiles({
  iconAssetIds,
  resolveEnemies,
  tiles,
}: {
  iconAssetIds: Set<string>;
  resolveEnemies: (tile: VisibleWorldTile) => Enemy[];
  tiles: VisibleWorldTile[];
}) {
  for (const tile of tiles) {
    if (isUnknownVisibleWorldTile(tile)) {
      iconAssetIds.add(WorldIcons.UnknownHex);
      continue;
    }

    iconAssetIds.add(terrainArtFor(tile.terrain));

    if (tile.structure) {
      iconAssetIds.add(
        tile.structure === 'town' && tile.claim?.ownerType === 'faction'
          ? WorldIcons.Castle
          : structureIconFor(tile.structure),
      );
    }

    if (tile.items.length > 0) {
      iconAssetIds.add(WorldIcons.ForgottenLoot);
    }

    if (tile.claim?.npc?.enemyId) {
      iconAssetIds.add(WorldIcons.Village);
    }

    resolveEnemies(tile).forEach((enemy) => {
      iconAssetIds.add(enemyIconFor(enemy));
    });
  }

  return iconAssetIds;
}

function loadStandaloneWorldIconTexture(icon: string) {
  return loadImageTexture(icon, `Failed to load world icon texture: ${icon}`);
}

function loadWorldTerrainAtlasFrameTexture(icon: WorldTerrainAtlasFrameId) {
  const frame = getWorldTerrainFrame(icon);

  return loadWorldTerrainAtlasBaseTexture().then(
    (atlasTexture) =>
      new Texture({
        label: icon,
        source: atlasTexture.source,
        frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
        orig: new Rectangle(0, 0, frame.w, frame.h),
      }),
  );
}

function loadWorldTerrainAtlasBaseTexture() {
  if (
    worldTerrainAtlasBaseTexture &&
    !isDestroyedWorldIconTexture(worldTerrainAtlasBaseTexture)
  ) {
    return Promise.resolve(worldTerrainAtlasBaseTexture);
  }

  worldTerrainAtlasBaseTexture = null;
  worldTerrainAtlasBaseTextureLoad ??= loadImageTexture(
    getWorldTerrainAtlasImage(),
    'Failed to load world terrain atlas texture.',
  )
    .then((texture) => {
      worldTerrainAtlasBaseTexture = texture;
      return texture;
    })
    .finally(() => {
      worldTerrainAtlasBaseTextureLoad = null;
    });

  return worldTerrainAtlasBaseTextureLoad;
}

function loadImageTexture(imageUrl: string, errorMessage: string) {
  return new Promise<Texture>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      void createLoadedImageTexture(imageUrl, image).then(resolve, reject);
    };
    image.onerror = () => {
      reject(new Error(errorMessage));
    };
    image.src = imageUrl;
  });
}

async function createLoadedImageTexture(
  imageUrl: string,
  image: HTMLImageElement,
) {
  if (typeof image.decode === 'function') {
    try {
      await image.decode();
    } catch {
      // Some browsers reject decode() for already-complete SVG data URIs.
      // The successful onload path is enough for the canvas raster fallback below.
    }
  }

  return new Texture({
    source: new ImageSource({
      resource: shouldRasterizeLoadedImage(imageUrl)
        ? rasterizeLoadedImage(image)
        : image,
    }),
  });
}

function shouldRasterizeLoadedImage(imageUrl: string) {
  return (
    imageUrl.startsWith('data:image/svg+xml') ||
    /\.svg(?:$|[?#])/i.test(imageUrl)
  );
}

function rasterizeLoadedImage(image: HTMLImageElement) {
  const width = Math.max(1, image.naturalWidth || image.width || 1);
  const height = Math.max(1, image.naturalHeight || image.height || 1);
  const canvas = createRasterizationCanvas(width, height);
  const context = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;

  if (!context) {
    throw new Error('World icon rasterization canvas is unavailable.');
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

function createRasterizationCanvas(width: number, height: number) {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  throw new Error(
    'World icon rasterization requested before a canvas is available.',
  );
}

function takeValidWorldIconTexture(cache: Map<string, Texture>, icon: string) {
  const texture = cache.get(icon);
  if (!texture) {
    return null;
  }

  if (isDestroyedWorldIconTexture(texture)) {
    cache.delete(icon);
    return null;
  }

  return texture;
}

function isDestroyedWorldIconTexture(texture: Texture) {
  const candidate = texture as Texture & {
    source?: { destroyed?: boolean } | null;
  };

  return (
    candidate.destroyed === true ||
    (candidate.source === null && 'source' in candidate) ||
    candidate.source?.destroyed === true
  );
}

function scheduleWorldIconWarmup() {
  if (worldIconWarmupHandle !== null || worldIconWarmupQueue.length === 0) {
    return;
  }

  const runWarmupBatch = (deadline?: IdleDeadline) => {
    worldIconWarmupHandle = null;
    const sliceStart = performance.now();
    let startedLoads = 0;

    while (
      worldIconWarmupQueue.length > 0 &&
      shouldContinueWorldIconWarmup(deadline, sliceStart, startedLoads)
    ) {
      const nextIcon = worldIconWarmupQueue.shift();
      if (!nextIcon) {
        continue;
      }

      queuedWorldIconWarmups.delete(nextIcon);
      void loadWorldIconTexture(nextIcon).catch(() => undefined);
      startedLoads += 1;
    }

    if (worldIconWarmupQueue.length > 0) {
      scheduleWorldIconWarmup();
    }
  };

  if (typeof window.requestIdleCallback === 'function') {
    worldIconWarmupHandle = window.requestIdleCallback(runWarmupBatch, {
      timeout: 200,
    });
    return;
  }

  worldIconWarmupHandle = window.setTimeout(() => {
    runWarmupBatch();
  }, 0);
}

function shouldContinueWorldIconWarmup(
  deadline: IdleDeadline | undefined,
  sliceStart: number,
  startedLoads: number,
) {
  if (startedLoads >= WORLD_ICON_BACKGROUND_WARMUP_BATCH_SIZE) {
    return false;
  }

  if (deadline) {
    return deadline.timeRemaining() > 4;
  }

  return performance.now() - sliceStart < WORLD_ICON_WARMUP_FALLBACK_SLICE_MS;
}

function getWorldIconPlaceholderTexture() {
  if (worldIconPlaceholderTexture) {
    return worldIconPlaceholderTexture;
  }

  const resource = createWorldIconPlaceholderResource();
  worldIconPlaceholderTexture = new Texture({
    source: new ImageSource({
      resource,
    }),
  });
  return worldIconPlaceholderTexture;
}

function createWorldIconPlaceholderResource() {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas;
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(1, 1);
  }

  throw new Error(
    'World icon placeholder requested before a canvas resource is available.',
  );
}
