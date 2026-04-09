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

export function renderScene(
  app: Application,
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
  selected: HexCoord,
  hoveredMove: HexCoord | null,
  viewCenter: { q: number; r: number } = state.player.coord,
) {
  app.stage
    .removeChildren()
    .forEach((child) => child.destroy({ children: true }));

  const world = new Container();
  const labels = new Container();
  app.stage.addChild(world, labels);

  const originX = app.screen.width / 2;
  const originY = app.screen.height / 2;

  visibleTiles.forEach((tile) => {
    const distance = hexDistance(state.player.coord, tile.coord);
    const clickable =
      distance === 1 && tile.terrain !== 'water' && tile.terrain !== 'mountain';
    const emphasized = distance === 0 || clickable;
    const relative = {
      q: tile.coord.q - viewCenter.q,
      r: tile.coord.r - viewCenter.r,
    };
    const point = tileToPoint(relative, originX, originY, HEX_SIZE);
    const poly = makeHex(point.x, point.y, HEX_SIZE - 1);

    const shape = new Graphics();
    const style = tileStyle(tile.terrain);
    const hovered =
      hoveredMove?.q === tile.coord.q && hoveredMove?.r === tile.coord.r;
    const fillAlpha = hovered
      ? Math.min(1, style.alpha + 0.18)
      : emphasized
        ? style.alpha
        : 0.12;
    shape.beginFill(style.color, fillAlpha);
    shape.lineStyle(1, 0x1e293b, 0.9);
    shape.drawPolygon(poly);
    shape.endFill();
    world.addChild(shape);

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
        structureColor,
        42,
        42,
        emphasized ? 1 : 0.82,
      );
      marker.position.set(point.x, point.y);
      world.addChild(marker);
    }

    if (enemies.length > 0 && tile.structure !== 'dungeon') {
      const offsets = enemyOffsets(enemies.length);
      enemies.forEach((enemy, index) => {
        const sprite = makeShadowedSprite(
          enemyIconFor(enemy.name),
          enemyTint(enemy.name),
          32,
          32,
          emphasized ? 1 : 0.72,
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

  const player = makeShadowedSprite(Icons.Player, 0xffffff, 46, 46, 1);
  const playerPoint = tileToPoint(
    {
      q: state.player.coord.q - viewCenter.q,
      r: state.player.coord.r - viewCenter.r,
    },
    originX,
    originY,
    HEX_SIZE,
  );
  player.position.set(playerPoint.x, playerPoint.y);
  world.addChild(player);
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
) {
  const wrapper = new Container();
  wrapper.alpha = alpha;

  const shadow = Sprite.from(icon);
  shadow.anchor.set(0.5);
  shadow.position.set(2, 3);
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

function tileStyle(terrain: string) {
  switch (terrain) {
    case 'water':
      return { color: 0xdc2626, alpha: 0.14 };
    case 'mountain':
      return { color: 0xb91c1c, alpha: 0.16 };
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
