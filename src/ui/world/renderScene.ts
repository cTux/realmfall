import {
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  type Application,
} from 'pixi.js';
import {
  getEnemiesAt,
  getVisibleTiles,
  hexDistance,
  type GameState,
  type HexCoord,
} from '../../game/state';
import { enemyIconFor, enemyTint, Icons } from '../icons';
import { HEX_SIZE } from '../../app/constants';

export function renderScene(
  app: Application,
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
  selected: HexCoord,
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
      q: tile.coord.q - state.player.coord.q,
      r: tile.coord.r - state.player.coord.r,
    };
    const point = tileToPoint(relative, originX, originY, HEX_SIZE);
    const poly = makeHex(point.x, point.y, HEX_SIZE - 1);

    const shape = new Graphics();
    const style = tileStyle(tile.terrain);
    shape.beginFill(style.color, emphasized ? style.alpha : 0.12);
    shape.lineStyle(1, 0x1e293b, 0.9);
    shape.drawPolygon(poly);
    shape.endFill();
    world.addChild(shape);

    if (selected.q === tile.coord.q && selected.r === tile.coord.r) {
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

    if (tile.structure) {
      const marker = new Graphics();
      const color =
        tile.structure === 'town'
          ? 0xfbbf24
          : tile.structure === 'forge'
            ? 0xf97316
            : 0xa855f7;
      marker.beginFill(color, 0.95);
      if (tile.structure === 'town') {
        marker.drawRect(point.x - 6, point.y + 6, 12, 12);
      } else if (tile.structure === 'forge') {
        marker.drawPolygon([
          point.x,
          point.y + 2,
          point.x + 8,
          point.y + 10,
          point.x,
          point.y + 18,
          point.x - 8,
          point.y + 10,
        ]);
      } else {
        marker.drawPolygon([
          point.x,
          point.y + 2,
          point.x + 8,
          point.y + 18,
          point.x - 8,
          point.y + 18,
        ]);
      }
      marker.endFill();
      world.addChild(marker);
    }

    const enemies = getEnemiesAt(state, tile.coord);
    if (enemies.length > 0) {
      const offsets = enemyOffsets(enemies.length);
      enemies.forEach((enemy, index) => {
        const sprite = Sprite.from(enemyIconFor(enemy.name));
        sprite.anchor.set(0.5);
        sprite.position.set(
          point.x + offsets[index].x,
          point.y - 2 + offsets[index].y,
        );
        sprite.width = 32;
        sprite.height = 32;
        sprite.tint = enemyTint(enemy.name);
        sprite.alpha = emphasized ? 1 : 0.72;
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

  const player = Sprite.from(Icons.Player);
  player.anchor.set(0.5);
  player.position.set(originX, originY);
  player.width = 46;
  player.height = 46;
  player.tint = 0xfbbf24;
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
