import {
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  type Application,
  type DisplayObject,
} from 'pixi.js';
import {
  getEnemiesAt,
  getVisibleTiles,
  hexDistance,
  type GameState,
  type HexCoord,
} from '../../game/state';
import { createRng } from '../../game/random';
import {
  enemyIconFor,
  enemyTint,
  Icons,
  structureIconFor,
  structureTint,
} from '../icons';
import { HEX_SIZE } from '../../app/constants';
import { getTimeOfDayLighting, scaleColor } from './timeOfDay';

let smoothedShadowSource: { x: number; y: number } | null = null;
let lastShadowAnimationMs: number | null = null;

export function renderScene(
  app: Application,
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
  selected: HexCoord,
  hoveredMove: HexCoord | null,
  worldTimeMinutes = 12 * 60,
  animationMs = 0,
) {
  app.stage
    .removeChildren()
    .forEach((child) => child.destroy({ children: true }));

  const lighting = getTimeOfDayLighting(worldTimeMinutes);
  const sky = new Container();
  const atmosphere = new Container();
  const world = new Container();
  const waterfalls = new Container();
  const cloudShadows = new Container();
  const labels = new Container();
  const clouds = new Container();
  const overlay = new Container();
  app.stage.addChild(
    sky,
    atmosphere,
    world,
    waterfalls,
    labels,
    cloudShadows,
    clouds,
    overlay,
  );

  const originX = app.screen.width / 2;
  const originY = app.screen.height / 2;
  const sunPosition = getCelestialPosition(
    app.screen.width,
    app.screen.height,
    worldTimeMinutes,
  );
  const moonPosition = getCelestialPosition(
    app.screen.width,
    app.screen.height,
    worldTimeMinutes + 12 * 60,
  );
  const targetShadowSource = blendLightSources(
    sunPosition,
    moonPosition,
    lighting.sunOpacity,
    lighting.moonOpacity,
  );
  const shadowSource = smoothShadowSource(targetShadowSource, animationMs);
  const lightVector = normalizeVector({
    x: originX - shadowSource.x,
    y: originY - shadowSource.y,
  });
  const shadowOffset = {
    x: lightVector.x * 10,
    y: lightVector.y * 10,
  };

  renderSkyLayer(app, sky, lighting.skyColor);
  renderAtmosphere(
    app,
    atmosphere,
    lighting,
    animationMs,
    sunPosition,
    moonPosition,
    {
      x: originX,
      y: originY,
    },
  );

  visibleTiles.forEach((tile) => {
    const distance = hexDistance(state.player.coord, tile.coord);
    const isPlayerTile =
      tile.coord.q === state.player.coord.q &&
      tile.coord.r === state.player.coord.r;
    const clickable =
      distance === 1 && tile.terrain !== 'water' && tile.terrain !== 'mountain';
    const emphasized = distance === 0 || clickable;
    const relative = {
      q: tile.coord.q - state.player.coord.q,
      r: tile.coord.r - state.player.coord.r,
    };
    const point = tileToPoint(relative, originX, originY, HEX_SIZE);
    const poly = makeHex(point.x, point.y, HEX_SIZE);

    const shape = new Graphics();
    const style = tileStyle(tile.terrain);
    const hovered =
      hoveredMove?.q === tile.coord.q && hoveredMove?.r === tile.coord.r;
    const tileBrightness = hovered
      ? lighting.ambientBrightness + 0.2
      : lighting.ambientBrightness;
    const litTileColor = scaleColor(style.color, tileBrightness);
    const fillAlpha = hovered
      ? Math.min(1, style.alpha + 0.26)
      : emphasized
        ? style.alpha
        : 0.8;
    shape.beginFill(litTileColor, fillAlpha);
    shape.lineStyle(1, 0x1e293b, 0.9);
    shape.drawPolygon(poly);
    shape.endFill();
    world.addChild(shape);

    renderTileGroundCover(
      world,
      tile,
      point,
      lighting.ambientBrightness,
      state.seed,
    );

    if (tile.terrain === 'water' && distance === state.radius) {
      renderEdgeWaterfall(
        waterfalls,
        point,
        relative,
        animationMs,
        lighting.ambientBrightness,
      );
    }

    if (
      !hovered &&
      !isPlayerTile &&
      selected.q === tile.coord.q &&
      selected.r === tile.coord.r
    ) {
      const outline = new Graphics();
      outline.lineStyle(3, 0xf8fafc, 0.65);
      outline.drawPolygon(poly);
      world.addChild(outline);
    } else if (tile.items.length > 0 && emphasized) {
      const lootBorder = new Graphics();
      lootBorder.lineStyle(3, 0x22c55e, 0.95);
      lootBorder.drawPolygon(poly);
      world.addChild(lootBorder);
    }

    const enemies = getEnemiesAt(state, tile.coord);

    if (tile.structure) {
      const structureColor =
        tile.structure === 'dungeon' && enemies.length === 0
          ? 0x94a3b8
          : structureTint(tile.structure);
      const marker = makeShadowedSprite(
        structureIconFor(tile.structure),
        scaleColor(structureColor, lighting.ambientBrightness + 0.08),
        42,
        42,
        emphasized ? 1 : 0.82,
        shadowOffset,
      );
      marker.position.set(point.x, point.y);
      world.addChild(marker);
    }

    if (enemies.length > 0 && tile.structure !== 'dungeon') {
      const offsets = enemyOffsets(enemies.length);
      enemies.forEach((enemy, index) => {
        const sprite = makeShadowedSprite(
          enemyIconFor(enemy.name),
          scaleColor(enemyTint(enemy.name), lighting.ambientBrightness + 0.04),
          32,
          32,
          emphasized ? 1 : 0.72,
          shadowOffset,
        );
        sprite.position.set(
          point.x + offsets[index].x,
          point.y - 2 + offsets[index].y,
        );
        world.addChild(sprite);
      });

      const level = new Text(
        `L${Math.max(...enemies.map((foe) => foe.tier))}`,
        new TextStyle({ fill: 0xfef2f2, fontSize: 12, fontWeight: '700' }),
      );
      level.position.set(point.x - 12, point.y - 32);
      level.alpha = emphasized ? 1 : 0.78;
      labels.addChild(level);

      if (enemies.length > 1) {
        const groupLabel = new Text(
          `x${enemies.length}`,
          new TextStyle({ fill: 0xfef3c7, fontSize: 11, fontWeight: '700' }),
        );
        groupLabel.position.set(point.x + 8, point.y - 26);
        groupLabel.alpha = emphasized ? 1 : 0.78;
        labels.addChild(groupLabel);
      }
    }
  });

  const player = makeShadowedSprite(
    Icons.Player,
    scaleColor(0xffffff, Math.max(0.84, lighting.ambientBrightness + 0.08)),
    46,
    46,
    1,
    shadowOffset,
  );
  player.position.set(originX, originY);
  world.addChild(player);

  renderCloudLayer(
    app,
    cloudShadows,
    clouds,
    animationMs,
    lighting,
    state.seed,
    shadowOffset,
  );
  renderWorldOverlay(
    app,
    overlay,
    lighting.overlayColor,
    lighting.overlayAlpha,
  );
}

function renderSkyLayer(app: Application, layer: Container, skyColor: number) {
  const skyFill = new Graphics();
  skyFill.beginFill(skyColor, 1);
  skyFill.drawRect(0, 0, app.screen.width, app.screen.height);
  skyFill.endFill();
  layer.addChild(skyFill);
}

function renderAtmosphere(
  app: Application,
  layer: Container,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  animationMs: number,
  sunPosition: { x: number; y: number },
  moonPosition: { x: number; y: number },
  focalPoint: { x: number; y: number },
) {
  if (lighting.shaftAlpha > 0.01) {
    renderLightShafts(
      app,
      layer,
      animationMs,
      sunPosition,
      focalPoint,
      0xfbbf24,
      lighting.shaftAlpha * lighting.sunShaftOpacity,
    );
    renderLightShafts(
      app,
      layer,
      animationMs,
      moonPosition,
      focalPoint,
      0xcbd5ff,
      lighting.shaftAlpha * lighting.moonShaftOpacity,
    );
  }

  renderCelestialBody(
    layer,
    moonPosition,
    scaleColor(0xdbeafe, lighting.ambientBrightness + 0.1),
    lighting.moonOpacity * lighting.celestialAlpha * 0.72,
    24,
  );
  renderCelestialBody(
    layer,
    sunPosition,
    scaleColor(0xfff7d6, lighting.ambientBrightness + 0.08),
    lighting.sunOpacity * lighting.celestialAlpha,
    30,
  );
}

function renderLightShafts(
  app: Application,
  layer: Container,
  animationMs: number,
  sourcePosition: { x: number; y: number },
  focalPoint: { x: number; y: number },
  tint: number,
  opacity: number,
) {
  if (opacity <= 0.01) return;

  const shaftDrift = Math.sin(animationMs * 0.00035) * 24;
  const shaftConfigs = [
    { width: 90, reach: 0.62, alpha: opacity * 0.6 },
    { width: 140, reach: 0.74, alpha: opacity * 0.38 },
    { width: 210, reach: 0.88, alpha: opacity * 0.22 },
  ];

  shaftConfigs.forEach((shaft, index) => {
    const beam = new Graphics();
    const spread = shaft.width + index * 34;
    const focusPoint = {
      x: focalPoint.x + shaftDrift * (0.5 + index * 0.18),
      y: focalPoint.y + app.screen.height * (shaft.reach - 0.6),
    };
    const beamVector = normalizeVector({
      x: focusPoint.x - sourcePosition.x,
      y: focusPoint.y - sourcePosition.y,
    });
    const perpendicular = { x: -beamVector.y, y: beamVector.x };
    const nearSpread = 14 + index * 6;
    beam.beginFill(tint, shaft.alpha);
    beam.drawPolygon([
      sourcePosition.x - perpendicular.x * nearSpread,
      sourcePosition.y - perpendicular.y * nearSpread,
      sourcePosition.x + perpendicular.x * nearSpread,
      sourcePosition.y + perpendicular.y * nearSpread,
      focusPoint.x + perpendicular.x * spread,
      focusPoint.y + perpendicular.y * spread,
      focusPoint.x - perpendicular.x * spread,
      focusPoint.y - perpendicular.y * spread,
    ]);
    beam.endFill();
    layer.addChild(beam);
  });
}

function renderCelestialBody(
  layer: Container,
  position: { x: number; y: number },
  tint: number,
  alpha: number,
  radius: number,
) {
  if (alpha <= 0.01) return;

  const haloLayers = [
    { scale: 4.2, alpha: 0.025 },
    { scale: 3.75, alpha: 0.04 },
    { scale: 3.3, alpha: 0.06 },
    { scale: 2.9, alpha: 0.085 },
    { scale: 2.5, alpha: 0.12 },
    { scale: 2.15, alpha: 0.16 },
    { scale: 1.8, alpha: 0.22 },
    { scale: 1.48, alpha: 0.3 },
  ];

  haloLayers.forEach((halo) => {
    const glow = new Graphics();
    glow.beginFill(tint, alpha * halo.alpha);
    glow.drawEllipse(
      position.x,
      position.y,
      radius * halo.scale,
      radius * halo.scale,
    );
    glow.endFill();
    layer.addChild(glow);
  });

  const glow = new Graphics();
  glow.beginFill(tint, alpha * 0.34);
  glow.drawEllipse(position.x, position.y, radius * 1.18, radius * 1.18);
  glow.endFill();

  const body = new Graphics();
  body.beginFill(tint, alpha);
  body.drawEllipse(position.x, position.y, radius, radius);
  body.endFill();

  layer.addChild(glow, body);
}

function renderWorldOverlay(
  app: Application,
  layer: Container,
  color: number,
  alpha: number,
) {
  if (alpha <= 0) return;
  const tint = new Graphics();
  tint.beginFill(color, alpha);
  tint.drawRect(0, 0, app.screen.width, app.screen.height);
  tint.endFill();
  layer.addChild(tint);
}

function tileToPoint(
  coord: HexCoord,
  originX: number,
  originY: number,
  size: number,
) {
  const x = size * Math.sqrt(3) * (coord.q + coord.r / 2) + originX;
  const y = size * 1.5 * coord.r + originY;
  return { x, y };
}

function makeHex(x: number, y: number, size: number) {
  const points: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(x + size * Math.cos(angle), y + size * Math.sin(angle));
  }
  return points;
}

function enemyOffsets(count: number) {
  const radius = count > 1 ? 14 : 0;
  return Array.from({ length: count }, (_, index) => {
    if (count === 1) return { x: 0, y: 0 };
    const angle =
      (-Math.PI / 2 + (Math.PI * 2 * index) / count) % (Math.PI * 2);
    return {
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
    };
  });
}

function makeShadowedSprite(
  icon: string,
  tint: number,
  width: number,
  height: number,
  alpha: number,
  shadowOffset: { x: number; y: number },
) {
  const wrapper = new Container();
  wrapper.alpha = alpha;

  const shadowLayers = [
    { offset: 0.4, alpha: 0.18, scale: 1.06 },
    { offset: 0.75, alpha: 0.12, scale: 1.03 },
    { offset: 1, alpha: 0.08, scale: 1 },
  ];

  shadowLayers.forEach((layer) => {
    const shadow = Sprite.from(icon);
    shadow.anchor.set(0.5);
    shadow.position.set(
      shadowOffset.x * layer.offset,
      shadowOffset.y * layer.offset,
    );
    shadow.width = width * layer.scale;
    shadow.height = height * layer.scale;
    shadow.tint = 0x000000;
    shadow.alpha = layer.alpha;
    wrapper.addChild(shadow);
  });

  const sprite = Sprite.from(icon);
  sprite.anchor.set(0.5);
  sprite.width = width;
  sprite.height = height;
  sprite.tint = tint;

  wrapper.addChild(sprite);
  return wrapper as DisplayObject & Container;
}

function renderCloudLayer(
  app: Application,
  shadowLayer: Container,
  cloudLayer: Container,
  animationMs: number,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  worldSeed: string,
  shadowOffset: { x: number; y: number },
) {
  const cloudCount = 22;
  const weatherIcons = [Icons.SunCloud, Icons.Raining, Icons.Snowing];
  const clusterOffsets = [
    { x: -38, y: 12, scale: 0.72 },
    { x: -16, y: -6, scale: 0.9 },
    { x: 14, y: 6, scale: 1 },
    { x: 40, y: -8, scale: 0.82 },
  ];

  for (let index = 0; index < cloudCount; index += 1) {
    const rng = createRng(`${worldSeed}-cloud-${index}`);
    const scale = 0.88 + rng() * 0.68;
    const width = 92 * scale;
    const height = 92 * scale;
    const travelPadding = 180 + rng() * 220;
    const travel = app.screen.width + travelPadding + width * 2;
    const baseOffset = rng() * travel;
    const speed = 0.0048 + rng() * 0.0062;
    const progress = (animationMs * speed + baseOffset) % travel;
    const x = progress - width - travelPadding * 0.5;
    const yBase = app.screen.height * (0.05 + rng() * 0.56);
    const y =
      yBase +
      Math.sin(animationMs * (0.00024 + rng() * 0.0002) + rng() * Math.PI * 2) *
        (4 + rng() * 10);
    const icon = weatherIcons[Math.floor(rng() * weatherIcons.length)];
    const shadowOpacity = 0.1 + rng() * 0.06;
    const cloudOpacity = Math.max(
      0.24,
      0.34 + rng() * 0.12 + lighting.cloudAlphaBoost,
    );

    clusterOffsets.forEach((offset) => {
      const spriteWidth = width * offset.scale;
      const spriteHeight = height * offset.scale;

      const shadow = makeWeatherSprite(
        icon,
        scaleColor(0x020617, Math.max(0.8, lighting.ambientBrightness * 0.72)),
        spriteWidth * 1.05,
        spriteHeight * 1.05,
        shadowOpacity,
      );
      shadow.position.set(
        x + width * 0.5 + offset.x * scale + shadowOffset.x * 2.2,
        y + height * 0.5 + offset.y * scale + shadowOffset.y * 2.2,
      );
      shadowLayer.addChild(shadow);

      const shadowSoftener = makeWeatherSprite(
        icon,
        scaleColor(0x020617, Math.max(0.8, lighting.ambientBrightness * 0.68)),
        spriteWidth * 1.12,
        spriteHeight * 1.12,
        shadowOpacity * 0.45,
      );
      shadowSoftener.position.set(
        x + width * 0.5 + offset.x * scale + shadowOffset.x * 1.6,
        y + height * 0.5 + offset.y * scale + shadowOffset.y * 1.6,
      );
      shadowLayer.addChild(shadowSoftener);

      const cloud = makeWeatherSprite(
        icon,
        scaleColor(0xffffff, Math.max(0.82, lighting.ambientBrightness + 0.16)),
        spriteWidth,
        spriteHeight,
        cloudOpacity,
      );
      cloud.position.set(
        x + width * 0.5 + offset.x * scale,
        y + height * 0.5 + offset.y * scale,
      );
      cloudLayer.addChild(cloud);
    });
  }
}

function makeWeatherSprite(
  icon: string,
  tint: number,
  width: number,
  height: number,
  alpha: number,
) {
  const sprite = Sprite.from(icon);
  sprite.anchor.set(0.5);
  sprite.width = width;
  sprite.height = height;
  sprite.tint = tint;
  sprite.alpha = alpha;
  return sprite;
}

function renderTileGroundCover(
  layer: Container,
  tile: GameState['tiles'][string],
  point: { x: number; y: number },
  ambientBrightness: number,
  worldSeed: string,
) {
  const groundCover = groundCoverStyle(tile.terrain);
  if (!groundCover) return;

  const rng = createRng(
    `${worldSeed}-ground-cover-${tile.coord.q},${tile.coord.r}-${tile.terrain}`,
  );
  if (rng() > 0.3) return;

  const grass = makeWeatherSprite(
    Icons.HighGrass,
    scaleColor(
      groundCover.tint,
      ambientBrightness + groundCover.brightnessBoost,
    ),
    groundCover.width,
    groundCover.height,
    groundCover.alpha,
  );
  grass.position.set(point.x, point.y + HEX_SIZE * 0.42 + (rng() - 0.5) * 4);
  layer.addChild(grass);
}

function renderEdgeWaterfall(
  layer: Container,
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
    const stream = new Graphics();
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
    layer.addChild(stream);
  }
}

function tileStyle(terrain: string) {
  switch (terrain) {
    case 'water':
      return { color: 0xdc2626, alpha: 0.34 };
    case 'mountain':
      return { color: 0xb91c1c, alpha: 0.36 };
    case 'forest':
      return { color: 0x166534, alpha: 1 };
    case 'swamp':
      return { color: 0x0f766e, alpha: 1 };
    case 'desert':
      return { color: 0xca8a04, alpha: 1 };
    default:
      return { color: 0x3f7d3f, alpha: 1 };
  }
}

function groundCoverStyle(terrain: string) {
  switch (terrain) {
    case 'plains':
      return {
        tint: 0x86efac,
        alpha: 0.34,
        width: 28,
        height: 28,
        brightnessBoost: 0.02,
      };
    case 'forest':
      return {
        tint: 0x4ade80,
        alpha: 0.28,
        width: 30,
        height: 30,
        brightnessBoost: -0.02,
      };
    case 'swamp':
      return {
        tint: 0x6ee7b7,
        alpha: 0.26,
        width: 28,
        height: 28,
        brightnessBoost: -0.04,
      };
    case 'desert':
      return {
        tint: 0xfde68a,
        alpha: 0.22,
        width: 24,
        height: 24,
        brightnessBoost: 0.05,
      };
    default:
      return null;
  }
}

function getCelestialPosition(
  screenWidth: number,
  screenHeight: number,
  worldTimeMinutes: number,
) {
  const dayMinutes = 24 * 60;
  const progress =
    (((worldTimeMinutes % dayMinutes) + dayMinutes) % dayMinutes) / dayMinutes;
  const horizonStartX = screenWidth * 0.08;
  const horizonEndX = screenWidth * 0.92;
  const horizonY = screenHeight * 0.46;
  const apexHeight = screenHeight * 0.34;
  const x = horizonStartX + (horizonEndX - horizonStartX) * progress;
  const y = horizonY - Math.sin(progress * Math.PI) * apexHeight;
  return { x, y };
}

function normalizeVector(vector: { x: number; y: number }) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function blendLightSources(
  sunPosition: { x: number; y: number },
  moonPosition: { x: number; y: number },
  sunOpacity: number,
  moonOpacity: number,
) {
  const totalOpacity = Math.max(0.0001, sunOpacity + moonOpacity);
  return {
    x:
      (sunPosition.x * sunOpacity + moonPosition.x * moonOpacity) /
      totalOpacity,
    y:
      (sunPosition.y * sunOpacity + moonPosition.y * moonOpacity) /
      totalOpacity,
  };
}

function smoothShadowSource(
  target: { x: number; y: number },
  animationMs: number,
) {
  if (smoothedShadowSource == null || lastShadowAnimationMs == null) {
    smoothedShadowSource = { ...target };
    lastShadowAnimationMs = animationMs;
    return smoothedShadowSource;
  }

  const deltaMs = Math.max(
    0,
    Math.min(1000, animationMs - lastShadowAnimationMs),
  );
  const progress = Math.min(1, deltaMs / 1000);
  smoothedShadowSource = {
    x: lerp(smoothedShadowSource.x, target.x, progress),
    y: lerp(smoothedShadowSource.y, target.y, progress),
  };
  lastShadowAnimationMs = animationMs;
  return smoothedShadowSource;
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}
