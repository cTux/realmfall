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
import {
  enemyIconFor,
  enemyTint,
  Icons,
  structureIconFor,
  structureTint,
} from '../icons';
import { HEX_SIZE } from '../../app/constants';
import { getTimeOfDayLighting, scaleColor } from './timeOfDay';

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
  const celestialPosition =
    lighting.celestialBody === 'sun' ? sunPosition : moonPosition;
  const lightVector = normalizeVector({
    x: originX - celestialPosition.x,
    y: originY - celestialPosition.y,
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
    const litTileColor = scaleColor(style.color, lighting.ambientBrightness);
    const hovered =
      hoveredMove?.q === tile.coord.q && hoveredMove?.r === tile.coord.r;
    const fillAlpha = hovered
      ? Math.min(1, style.alpha + 0.18)
      : emphasized
        ? style.alpha
        : 0.8;
    shape.beginFill(litTileColor, fillAlpha);
    shape.lineStyle(1, 0x1e293b, 0.9);
    shape.drawPolygon(poly);
    shape.endFill();
    world.addChild(shape);

    if (tile.terrain === 'water' && distance === state.radius) {
      renderEdgeWaterfall(
        waterfalls,
        point,
        relative,
        animationMs,
        lighting.ambientBrightness,
      );
    }

    if (hovered) {
      const outline = new Graphics();
      outline.lineStyle(3, 0xe2e8f0, 0.85);
      outline.drawPolygon(poly);
      world.addChild(outline);
    } else if (selected.q === tile.coord.q && selected.r === tile.coord.r) {
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
  const activePosition =
    lighting.celestialBody === 'sun' ? sunPosition : moonPosition;
  const passivePosition =
    lighting.celestialBody === 'sun' ? moonPosition : sunPosition;
  renderCelestialBody(
    layer,
    passivePosition,
    lighting.celestialBody === 'sun' ? 0xcbd5ff : 0xfbbf24,
    lighting.celestialBody === 'sun' ? 0.16 : 0.1,
    18,
  );

  const bodyGlow = new Graphics();
  bodyGlow.beginFill(lighting.celestialTint, lighting.celestialAlpha * 0.22);
  bodyGlow.drawEllipse(activePosition.x, activePosition.y, 78, 78);
  bodyGlow.endFill();

  const body = new Graphics();
  body.beginFill(lighting.celestialTint, lighting.celestialAlpha);
  body.drawEllipse(
    activePosition.x,
    activePosition.y,
    lighting.celestialBody === 'sun' ? 30 : 24,
    lighting.celestialBody === 'sun' ? 30 : 24,
  );
  body.endFill();
  layer.addChild(bodyGlow, body);

  if (lighting.shaftAlpha <= 0.01) return;

  const shaftDrift = Math.sin(animationMs * 0.00035) * 24;
  const shaftConfigs = [
    { width: 90, reach: 0.62, alpha: lighting.shaftAlpha * 0.6 },
    { width: 140, reach: 0.74, alpha: lighting.shaftAlpha * 0.38 },
    { width: 210, reach: 0.88, alpha: lighting.shaftAlpha * 0.22 },
  ];

  shaftConfigs.forEach((shaft, index) => {
    const beam = new Graphics();
    const spread = shaft.width + index * 34;
    const focusPoint = {
      x: focalPoint.x + shaftDrift * (0.5 + index * 0.18),
      y: focalPoint.y + app.screen.height * (shaft.reach - 0.6),
    };
    const beamVector = normalizeVector({
      x: focusPoint.x - activePosition.x,
      y: focusPoint.y - activePosition.y,
    });
    const perpendicular = { x: -beamVector.y, y: beamVector.x };
    const nearSpread = 14 + index * 6;
    beam.beginFill(lighting.celestialTint, shaft.alpha);
    beam.drawPolygon([
      activePosition.x - perpendicular.x * nearSpread,
      activePosition.y - perpendicular.y * nearSpread,
      activePosition.x + perpendicular.x * nearSpread,
      activePosition.y + perpendicular.y * nearSpread,
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
  const glow = new Graphics();
  glow.beginFill(tint, alpha * 0.25);
  glow.drawEllipse(position.x, position.y, radius * 2.2, radius * 2.2);
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

  const shadow = Sprite.from(icon);
  shadow.anchor.set(0.5);
  shadow.position.set(shadowOffset.x, shadowOffset.y);
  shadow.width = width;
  shadow.height = height;
  shadow.tint = 0x000000;
  shadow.alpha = 0.42;

  const sprite = Sprite.from(icon);
  sprite.anchor.set(0.5);
  sprite.width = width;
  sprite.height = height;
  sprite.tint = tint;

  wrapper.addChild(shadow, sprite);
  return wrapper as DisplayObject & Container;
}

function renderCloudLayer(
  app: Application,
  shadowLayer: Container,
  cloudLayer: Container,
  animationMs: number,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  shadowOffset: { x: number; y: number },
) {
  const cloudCount = 22;
  const speed = 0.01;
  const weatherIcons = [Icons.SunCloud, Icons.Raining, Icons.Snowing];
  const clusterOffsets = [
    { x: -38, y: 12, scale: 0.72 },
    { x: -16, y: -6, scale: 0.9 },
    { x: 14, y: 6, scale: 1 },
    { x: 40, y: -8, scale: 0.82 },
  ];

  for (let index = 0; index < cloudCount; index += 1) {
    const scale = 0.9 + (index % 4) * 0.16;
    const width = 92 * scale;
    const height = 92 * scale;
    const spacing = app.screen.width / cloudCount;
    const travel = app.screen.width + spacing * cloudCount + width * 2;
    const progress = (animationMs * speed + spacing * index * 1.35) % travel;
    const x = progress - width;
    const y =
      app.screen.height * (0.08 + (index % 6) * 0.1) +
      Math.sin(animationMs * 0.00045 + index * 1.7) * 8;
    const icon = weatherIcons[index % weatherIcons.length];
    const shadowOpacity = 0.12 + (index % 3) * 0.02;
    const cloudOpacity = Math.max(
      0.06,
      0.14 + (index % 4) * 0.024 + lighting.cloudAlphaBoost,
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

      const cloud = makeWeatherSprite(
        icon,
        scaleColor(0xf8fafc, Math.max(0.7, lighting.ambientBrightness + 0.12)),
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
