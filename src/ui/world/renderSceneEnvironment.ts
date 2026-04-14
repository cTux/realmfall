import { BLEND_MODES } from 'pixi.js';
import { HEX_SIZE } from '../../app/constants';
import { createRng } from '../../game/random';
import { getWorldBossCenter } from '../../game/worldBoss';
import {
  type Enemy,
  type HexCoord,
  type Terrain,
  type Tile,
} from '../../game/state';
import forestClearingIcon from '../../assets/forest-pack/forest_03_clearing.png';
import forestDeadIcon from '../../assets/forest-pack/forest_04_dead.png';
import forestFewTreesIcon from '../../assets/forest-pack/forest_02_fewTrees.png';
import forestWildBushesIcon from '../../assets/forest-pack/forest_06_wildBushes.png';
import forestRiftIcon from '../../assets/forest-pack/forest_05_rift.png';
import forestFullIcon from '../../assets/forest-pack/forest_01_full.png';
import forestSpiderIcon from '../../assets/forest-pack/forest_08_spider.png';
import forestMushroomIcon from '../../assets/forest-pack/forest_10_mushroom.png';
import forestCaveIcon from '../../assets/forest-pack/forest_11_cave.png';
import forestHillIcon from '../../assets/forest-pack/forest_12_hill.png';
import forestVillageIcon from '../../assets/forest-pack/forest_15_village.png';
import forestRuinsIcon from '../../assets/forest-pack/forest_17_ruins.png';
import forestBlastIcon from '../../assets/forest-pack/forest_18_blast.png';
import forestTempleIcon from '../../assets/forest-pack/forest_20_temple.png';
import { scaleColor, type getTimeOfDayLighting } from './timeOfDay';
import { normalizeVector } from './renderSceneMath';
import { WorldIcons } from './worldIcons';
import {
  configureSprite,
  takeGraphics,
  takeSprite,
  type GraphicsPool,
  type SpritePool,
} from './renderScenePools';

const FOREST_TILE_ASPECT_RATIO = 222 / 255;
const FOREST_TILE_HEX_HEIGHT = 2.24;
const TERRAIN_BACKGROUND_ALPHA = 0.2;
const CLOUD_COUNT = 22;
const WEATHER_ICONS = [
  WorldIcons.SunCloud,
  WorldIcons.Raining,
  WorldIcons.Snowing,
];
const CLOUD_CLUSTER_OFFSETS = [
  { x: -38, y: 12, scale: 0.72 },
  { x: -16, y: -6, scale: 0.9 },
  { x: 14, y: 6, scale: 1 },
  { x: 40, y: -8, scale: 0.82 },
];

export interface CloudRenderInput {
  scale: number;
  travelPadding: number;
  baseOffsetRatio: number;
  speed: number;
  yRatio: number;
  bobSpeed: number;
  bobPhase: number;
  bobAmplitude: number;
  icon: string;
  shadowOpacity: number;
  cloudOpacity: number;
}

export interface TileGroundCoverPresentation {
  background: ReturnType<typeof backgroundVariant> | null;
}

export function buildCloudRenderInputs(worldSeed: string) {
  const inputs: CloudRenderInput[] = [];

  for (let index = 0; index < CLOUD_COUNT; index += 1) {
    const rng = createRng(`${worldSeed}-cloud-${index}`);
    inputs.push({
      scale: 0.88 + rng() * 0.68,
      travelPadding: 180 + rng() * 220,
      baseOffsetRatio: rng(),
      speed: 0.0048 + rng() * 0.0062,
      yRatio: rng(),
      bobSpeed: 0.00024 + rng() * 0.0002,
      bobPhase: rng() * Math.PI * 2,
      bobAmplitude: 4 + rng() * 10,
      icon: WEATHER_ICONS[Math.floor(rng() * WEATHER_ICONS.length)],
      shadowOpacity: 0.035 + rng() * 0.025,
      cloudOpacity: 0.34 + rng() * 0.12,
    });
  }

  return inputs;
}

export function getTileGroundCoverPresentation(
  tile: Tile,
  enemies: Enemy[],
  worldSeed: string,
): TileGroundCoverPresentation {
  const variants = tileBackgroundVariants(tile, enemies, worldSeed);
  if (variants.length === 0) {
    return { background: null };
  }

  const rng = createRng(
    `${worldSeed}-terrain-background-${tile.coord.q},${tile.coord.r}-${tile.terrain}-${tile.structure ?? 'none'}-${enemies.length}`,
  );

  return {
    background: variants[Math.floor(rng() * variants.length)],
  };
}

export function renderCloudLayer(
  screen: { width: number; height: number },
  shadowPool: SpritePool,
  cloudPool: SpritePool,
  animationMs: number,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  cloudInputs: CloudRenderInput[],
  shadowOffset: { x: number; y: number },
) {
  cloudInputs.forEach((cloudInput) => {
    const scale = cloudInput.scale;
    const width = 92 * scale;
    const height = 92 * scale;
    const travelPadding = cloudInput.travelPadding;
    const travel = screen.width + travelPadding + width * 2;
    const baseOffset = cloudInput.baseOffsetRatio * travel;
    const speed = cloudInput.speed;
    const progress = (animationMs * speed + baseOffset) % travel;
    const x = progress - width - travelPadding * 0.5;
    const yBase = screen.height * cloudInput.yRatio;
    const y =
      yBase +
      Math.sin(animationMs * cloudInput.bobSpeed + cloudInput.bobPhase) *
        cloudInput.bobAmplitude;
    const icon = cloudInput.icon;
    const shadowOpacity = cloudInput.shadowOpacity;
    const cloudOpacity = Math.max(
      0.24,
      cloudInput.cloudOpacity + lighting.cloudAlphaBoost,
    );

    CLOUD_CLUSTER_OFFSETS.forEach((offset) => {
      const spriteWidth = width * offset.scale;
      const spriteHeight = height * offset.scale;

      const shadowLayers = [
        { scale: 1.22, alpha: shadowOpacity * 0.2, offsetScale: 0.85 },
        { scale: 1.14, alpha: shadowOpacity * 0.34, offsetScale: 1.2 },
        { scale: 1.08, alpha: shadowOpacity * 0.52, offsetScale: 1.65 },
      ];

      shadowLayers.forEach((layer) => {
        const shadow = takeSprite(shadowPool, icon);
        configureSprite(
          shadow,
          scaleColor(
            0x020617,
            Math.max(0.66, lighting.ambientBrightness * 0.58),
          ),
          spriteWidth * layer.scale,
          spriteHeight * layer.scale,
          layer.alpha,
          {
            x:
              x +
              width * 0.5 +
              offset.x * scale +
              shadowOffset.x * layer.offsetScale,
            y:
              y +
              height * 0.5 +
              offset.y * scale +
              shadowOffset.y * layer.offsetScale,
          },
        );
      });

      const cloud = takeSprite(cloudPool, icon);
      configureSprite(
        cloud,
        scaleColor(0xffffff, Math.max(0.82, lighting.ambientBrightness + 0.16)),
        spriteWidth,
        spriteHeight,
        cloudOpacity,
        {
          x: x + width * 0.5 + offset.x * scale,
          y: y + height * 0.5 + offset.y * scale,
        },
      );
    });
  });
}

export function renderTileGroundCover(
  spritePool: SpritePool,
  presentation: TileGroundCoverPresentation,
  point: { x: number; y: number },
  hexSize: number,
) {
  const background = presentation.background;
  if (!background) return;

  const spriteHeight = hexSize * FOREST_TILE_HEX_HEIGHT * background.scale;
  const spriteWidth = spriteHeight * FOREST_TILE_ASPECT_RATIO;
  const grass = takeSprite(spritePool, background.icon);
  configureSprite(
    grass,
    scaleColor(0xffffff, 1 + background.brightnessBoost),
    spriteWidth,
    spriteHeight,
    background.alpha,
    { x: point.x, y: point.y + hexSize * background.yOffset },
  );
}

export function hasTileGroundCover(terrain: Terrain) {
  return (
    tileBackgroundVariants(
      { coord: { q: 0, r: 0 }, terrain, items: [], enemyIds: [] },
      [],
      '',
    ).length > 0
  );
}

export function renderEdgeWaterfall(
  graphicsPool: GraphicsPool,
  point: { x: number; y: number },
  relative: HexCoord,
  animationMs: number,
  ambientBrightness: number,
) {
  const flowDirection = normalizeVector({
    x: relative.q * 0.12,
    y: 1,
  });
  const perpendicular = { x: -flowDirection.y, y: flowDirection.x };
  const lip = {
    x: point.x + flowDirection.x * (HEX_SIZE * 0.7),
    y: point.y + flowDirection.y * (HEX_SIZE * 0.72),
  };
  const phase = animationMs * 0.0045;

  for (let index = 0; index < 3; index += 1) {
    const width = 12 - index * 2;
    const fallLength = 34 + ((phase + index * 0.9) % 1) * 42;
    const sprayLength = fallLength + 14 + index * 5;
    const alpha = 0.26 - index * 0.045;
    const tint = scaleColor(
      index === 0 ? 0x38bdf8 : 0x7dd3fc,
      ambientBrightness + 0.14,
    );
    const stream = takeGraphics(graphicsPool);
    stream.beginFill(tint, Math.max(0.08, alpha));
    stream.drawPolygon([
      lip.x - perpendicular.x * width,
      lip.y - perpendicular.y * width,
      lip.x + perpendicular.x * width,
      lip.y + perpendicular.y * width,
      lip.x + flowDirection.x * sprayLength + perpendicular.x * (width * 0.45),
      lip.y + flowDirection.y * sprayLength + perpendicular.y * (width * 0.45),
      lip.x + flowDirection.x * fallLength - perpendicular.x * (width * 0.45),
      lip.y + flowDirection.y * fallLength - perpendicular.y * (width * 0.45),
    ]);
    stream.endFill();
  }
}

export function renderCampfireLight(
  graphicsPool: GraphicsPool,
  point: { x: number; y: number },
  hexSize: number,
  ambientBrightness: number,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  animationMs: number,
) {
  const nightGlow = Math.max(
    0,
    Math.min(1, lighting.moonOpacity * 0.78 + lighting.overlayAlpha - 0.24),
  );
  if (nightGlow <= 0.01) return;

  const flicker = 0.88 + Math.sin(animationMs * 0.008) * 0.08;
  const pulse = 0.94 + Math.sin(animationMs * 0.0035 + point.x * 0.01) * 0.06;
  const haloTint = scaleColor(0xfb923c, 0.84 + ambientBrightness * 0.38);
  const emberTint = scaleColor(0xfef08a, 0.8 + ambientBrightness * 0.24);
  const haloLayers = [
    { width: 4.05, height: 2.95, alpha: 0.024 },
    { width: 3.6, height: 2.58, alpha: 0.032 },
    { width: 3.1, height: 2.24, alpha: 0.044 },
    { width: 2.68, height: 1.92, alpha: 0.06 },
    { width: 2.18, height: 1.56, alpha: 0.084 },
    { width: 1.74, height: 1.22, alpha: 0.114 },
  ];

  haloLayers.forEach((layer, index) => {
    const glow = takeGraphics(graphicsPool);
    const scale = flicker + index * 0.03;
    glow.blendMode = BLEND_MODES.ADD;
    glow.beginFill(haloTint, layer.alpha * nightGlow * pulse);
    glow.drawEllipse(
      point.x,
      point.y + hexSize * 0.2,
      hexSize * layer.width * scale,
      hexSize * layer.height * scale,
    );
    glow.endFill();
  });

  const bloomLayers = [
    { width: 1.92, height: 1.18, alpha: 0.082, yOffset: 0.12 },
    { width: 1.46, height: 0.9, alpha: 0.114, yOffset: 0.08 },
    { width: 1.06, height: 0.64, alpha: 0.152, yOffset: 0.04 },
  ];
  bloomLayers.forEach((layer, index) => {
    const bloom = takeGraphics(graphicsPool);
    bloom.blendMode = BLEND_MODES.ADD;
    bloom.beginFill(emberTint, layer.alpha * nightGlow * (1 + flicker * 0.08));
    bloom.drawEllipse(
      point.x,
      point.y + hexSize * layer.yOffset - index,
      hexSize * layer.width,
      hexSize * layer.height,
    );
    bloom.endFill();
  });

  const heatWash = takeGraphics(graphicsPool);
  heatWash.blendMode = BLEND_MODES.ADD;
  heatWash.beginFill(haloTint, 0.12 * nightGlow);
  heatWash.drawEllipse(
    point.x,
    point.y + hexSize * 0.08,
    hexSize * 1.16,
    hexSize * 0.8,
  );
  heatWash.endFill();

  const emberCore = takeGraphics(graphicsPool);
  emberCore.blendMode = BLEND_MODES.ADD;
  emberCore.beginFill(emberTint, 0.22 * nightGlow * (1.02 + flicker * 0.08));
  emberCore.drawEllipse(
    point.x,
    point.y + hexSize * 0.1,
    hexSize * 0.46,
    hexSize * 0.3,
  );
  emberCore.endFill();
}

export function tileStyle(terrain: string) {
  switch (terrain) {
    case 'rift':
      return { color: 0xb91c1c, alpha: 0.36 };
    case 'mountain':
      return { color: 0xb91c1c, alpha: 0.36 };
    default:
      return { color: 0x166534, alpha: 1 };
  }
}

function tileBackgroundVariants(
  tile: Tile,
  enemies: Enemy[],
  worldSeed: string,
) {
  if (worldSeed && getWorldBossCenter(worldSeed, tile.coord)) {
    return [backgroundVariant(forestDeadIcon, 1, 0, 0.01)];
  }
  if (tile.structure === 'tree') {
    return [backgroundVariant(forestFullIcon, 1.02, -0.01, 0.04)];
  }
  if (tile.structure === 'herbs') {
    return [backgroundVariant(forestWildBushesIcon, 1, 0, 0.05)];
  }
  if (
    tile.structure === 'copper-ore' ||
    tile.structure === 'iron-ore' ||
    tile.structure === 'coal-ore'
  ) {
    return [backgroundVariant(forestCaveIcon, 1, 0, 0.05)];
  }
  if (tile.structure === 'pond' || tile.structure === 'lake') {
    return [backgroundVariant(forestClearingIcon, 1, 0, 0.06)];
  }
  if (tile.structure === 'dungeon') {
    return [backgroundVariant(forestTempleIcon, 1.01, -0.01, 0.02)];
  }
  if (tile.structure === 'town') {
    return [backgroundVariant(forestVillageIcon, 1.01, -0.01, 0.05)];
  }
  if (tile.structure === 'camp') {
    return [backgroundVariant(forestMushroomIcon, 1, 0, 0.05)];
  }
  if (enemies.length > 0) {
    return [
      backgroundVariant(forestRuinsIcon, 1, 0, 0.03),
      backgroundVariant(forestBlastIcon, 1, 0, 0.03),
      backgroundVariant(forestSpiderIcon, 1, 0, 0.03),
    ];
  }
  if (tile.items.some((item) => item.name === 'Herbs')) {
    return [backgroundVariant(forestWildBushesIcon, 1, 0, 0.04)];
  }
  switch (tile.terrain) {
    case 'mountain':
      return [backgroundVariant(forestHillIcon, 1, -0.01, 0.02)];
    case 'rift':
      return [backgroundVariant(forestRiftIcon, 1, 0, 0.04)];
    default:
      return [backgroundVariant(forestFewTreesIcon, 1, 0, 0.04)];
  }
}

function backgroundVariant(
  icon: string,
  scale: number,
  yOffset: number,
  brightnessBoost: number,
) {
  return {
    icon,
    alpha: TERRAIN_BACKGROUND_ALPHA,
    scale,
    yOffset,
    brightnessBoost,
  };
}
