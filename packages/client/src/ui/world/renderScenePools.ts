import { Container, Graphics, Sprite, Text, type TextStyle } from 'pixi.js';
import { getWorldIconTexture } from './worldIcons';

export interface GraphicsPool {
  parent: Container;
  items: Graphics[];
  used: number;
}

export interface TextPool {
  parent: Container;
  items: Text[];
  used: number;
}

export interface ShadowedSpriteEntry {
  wrapper: Container;
  badgeBackground: Graphics;
  badgeTrackGraphics: Graphics;
  badgeFillGraphics: Graphics;
  badgePlateGraphics: Graphics;
  badgePrimaryText: Text;
  badgeSecondaryText: Text;
  outline: Sprite;
  shadows: Sprite[];
  sprite: Sprite;
}

export interface ShadowedSpritePool {
  freeStableItems: ShadowedSpriteEntry[];
  itemsByStableKey: Map<string, ShadowedSpriteEntry>;
  parent: Container;
  itemsByIcon: Map<string, ShadowedSpriteEntry[]>;
  stableOnlyItems: WeakSet<ShadowedSpriteEntry>;
  usedEntries: Set<ShadowedSpriteEntry>;
  usedStableKeys: Set<string>;
}

export interface SpritePool {
  parent: Container;
  itemsByIcon: Map<string, Sprite[]>;
  usedByIcon: Map<string, number>;
}

export function createGraphicsPool(parent: Container): GraphicsPool {
  return { parent, items: [], used: 0 };
}

export function resetGraphicsPool(pool: GraphicsPool) {
  pool.used = 0;
}

export function takeGraphics(pool: GraphicsPool) {
  let graphics = pool.items[pool.used];
  if (!graphics) {
    graphics = new Graphics();
    pool.items.push(graphics);
    pool.parent.addChild(graphics);
  }
  graphics.visible = true;
  graphics.clear();
  pool.used += 1;
  return graphics;
}

export function finishGraphicsPool(pool: GraphicsPool) {
  for (let index = pool.used; index < pool.items.length; index += 1) {
    pool.items[index].visible = false;
    pool.items[index].clear();
  }
}

export function createTextPool(parent: Container): TextPool {
  return { parent, items: [], used: 0 };
}

export function resetTextPool(pool: TextPool) {
  pool.used = 0;
}

export function takeText(pool: TextPool, style: TextStyle) {
  let text = pool.items[pool.used];
  if (!text) {
    text = new Text({ text: '', style });
    pool.items.push(text);
    pool.parent.addChild(text);
  }
  text.visible = true;
  text.style = style;
  pool.used += 1;
  return text;
}

export function finishTextPool(pool: TextPool) {
  for (let index = pool.used; index < pool.items.length; index += 1) {
    pool.items[index].visible = false;
  }
}

export function createShadowedSpritePool(
  parent: Container,
): ShadowedSpritePool {
  return {
    freeStableItems: [],
    itemsByStableKey: new Map(),
    parent,
    itemsByIcon: new Map(),
    stableOnlyItems: new WeakSet(),
    usedEntries: new Set(),
    usedStableKeys: new Set(),
  };
}

export function resetShadowedSpritePool(pool: ShadowedSpritePool) {
  pool.usedEntries.clear();
  pool.usedStableKeys.clear();
}

export function takeShadowedSprite(
  pool: ShadowedSpritePool,
  icon: string,
  options?: { stableKey?: string },
) {
  const stableKey = options?.stableKey;
  if (stableKey) {
    const texture = getWorldIconTexture(icon, { allowPending: true });
    let item = pool.itemsByStableKey.get(stableKey);

    if (!item) {
      const items = pool.itemsByIcon.get(icon) ?? [];
      item = items.find((candidate) => !pool.usedEntries.has(candidate));
      if (!item) {
        item = pool.freeStableItems.pop() ?? createShadowedSprite(icon);
        pool.stableOnlyItems.add(item);
        if (!pool.parent.children.includes(item.wrapper)) {
          pool.parent.addChild(item.wrapper);
        }
      }
      pool.itemsByStableKey.set(stableKey, item);
    }

    item.outline.texture = texture;
    item.shadows.forEach((shadow) => {
      shadow.texture = texture;
    });
    item.sprite.texture = texture;
    resetShadowedSpriteBadge(item);
    item.wrapper.visible = true;
    pool.usedEntries.add(item);
    pool.usedStableKeys.add(stableKey);
    return item;
  }

  const items = pool.itemsByIcon.get(icon) ?? [];
  const texture = getWorldIconTexture(icon, { allowPending: true });

  let item = items.find((candidate) => !pool.usedEntries.has(candidate));
  if (!item) {
    item = createShadowedSprite(icon);
    items.push(item);
    pool.itemsByIcon.set(icon, items);
    pool.parent.addChild(item.wrapper);
  }

  item.outline.texture = texture;
  item.shadows.forEach((shadow) => {
    shadow.texture = texture;
  });
  item.sprite.texture = texture;
  resetShadowedSpriteBadge(item);
  item.wrapper.visible = true;
  pool.usedEntries.add(item);
  return item;
}

export function finishShadowedSpritePool(pool: ShadowedSpritePool) {
  pool.itemsByIcon.forEach((items) => {
    items.forEach((item) => {
      if (pool.usedEntries.has(item)) {
        return;
      }

      item.wrapper.visible = false;
    });
  });

  const staleStableKeys: string[] = [];
  pool.itemsByStableKey.forEach((item, stableKey) => {
    if (pool.usedStableKeys.has(stableKey)) {
      return;
    }

    item.wrapper.visible = false;
    if (pool.stableOnlyItems.has(item)) {
      pool.freeStableItems.push(item);
    }
    staleStableKeys.push(stableKey);
  });

  staleStableKeys.forEach((stableKey) => {
    pool.itemsByStableKey.delete(stableKey);
  });
}

export function createSpritePool(parent: Container): SpritePool {
  return { parent, itemsByIcon: new Map(), usedByIcon: new Map() };
}

export function resetSpritePool(pool: SpritePool) {
  pool.usedByIcon.clear();
}

export function takeSprite(pool: SpritePool, icon: string) {
  const items = pool.itemsByIcon.get(icon) ?? [];
  const used = pool.usedByIcon.get(icon) ?? 0;
  const texture = getWorldIconTexture(icon, { allowPending: true });

  let item = items[used];
  if (!item) {
    item = new Sprite(getWorldIconTexture(icon, { allowPending: true }));
    item.anchor.set(0.5);
    items.push(item);
    pool.itemsByIcon.set(icon, items);
    pool.parent.addChild(item);
  }

  item.texture = texture;
  item.visible = true;
  pool.usedByIcon.set(icon, used + 1);
  return item;
}

export function finishSpritePool(pool: SpritePool) {
  pool.itemsByIcon.forEach((items, icon) => {
    const used = pool.usedByIcon.get(icon) ?? 0;
    for (let index = used; index < items.length; index += 1) {
      items[index].visible = false;
    }
  });
}

export function createShadowedSprite(icon: string): ShadowedSpriteEntry {
  const wrapper = new Container();
  const badgeBackground = new Graphics();
  const badgeTrackGraphics = new Graphics();
  const badgeFillGraphics = new Graphics();
  const badgePlateGraphics = new Graphics();
  const badgePrimaryText = new Text({ text: '' });
  const badgeSecondaryText = new Text({ text: '' });

  setTextAnchor(badgePrimaryText, 0.5);
  setTextAnchor(badgeSecondaryText, 0.5);
  wrapper.addChild(badgeBackground);
  wrapper.addChild(badgeTrackGraphics);
  const shadows = [0.3, 0.55, 0.8, 1].map(() => {
    const shadow = new Sprite(
      getWorldIconTexture(icon, { allowPending: true }),
    );
    shadow.anchor.set(0.5);
    wrapper.addChild(shadow);
    return shadow;
  });
  const outline = new Sprite(getWorldIconTexture(icon, { allowPending: true }));
  outline.anchor.set(0.5);
  wrapper.addChild(outline);
  const sprite = new Sprite(getWorldIconTexture(icon, { allowPending: true }));
  sprite.anchor.set(0.5);
  wrapper.addChild(sprite);
  wrapper.addChild(badgeFillGraphics);
  wrapper.addChild(badgePlateGraphics);
  wrapper.addChild(badgePrimaryText);
  wrapper.addChild(badgeSecondaryText);
  resetShadowedSpriteBadge({
    badgeBackground,
    badgeFillGraphics,
    badgePlateGraphics,
    badgePrimaryText,
    badgeSecondaryText,
    badgeTrackGraphics,
    outline,
    shadows,
    sprite,
    wrapper,
  });
  return {
    wrapper,
    badgeBackground,
    badgeTrackGraphics,
    badgeFillGraphics,
    badgePlateGraphics,
    badgePrimaryText,
    badgeSecondaryText,
    outline,
    shadows,
    sprite,
  };
}

export function configureShadowedSprite(
  entry: ShadowedSpriteEntry,
  tint: number,
  width: number,
  height: number,
  alpha: number,
  shadowOffset: { x: number; y: number },
  point: { x: number; y: number },
) {
  const outlineInsetPx = 2;

  entry.wrapper.visible = true;
  entry.wrapper.alpha = alpha;
  entry.wrapper.position.set(point.x, point.y);
  entry.wrapper.scale.set(1, 1);
  entry.wrapper.rotation = 0;

  const shadowLayers = [
    { offset: 0.3, alpha: 0.05, scale: 1.14 },
    { offset: 0.55, alpha: 0.045, scale: 1.1 },
    { offset: 0.8, alpha: 0.035, scale: 1.06 },
    { offset: 1, alpha: 0.025, scale: 1.02 },
  ];

  shadowLayers.forEach((layer, index) => {
    const shadow = entry.shadows[index];
    shadow.visible = true;
    shadow.position.set(
      shadowOffset.x * layer.offset,
      shadowOffset.y * layer.offset,
    );
    shadow.width = width * layer.scale;
    shadow.height = height * layer.scale;
    shadow.tint = 0x000000;
    shadow.alpha = layer.alpha;
  });

  entry.outline.visible = true;
  entry.outline.position.set(0, 0);
  entry.outline.width = width + outlineInsetPx * 2;
  entry.outline.height = height + outlineInsetPx * 2;
  entry.outline.tint = 0x000000;
  entry.outline.alpha = 1;

  entry.sprite.visible = true;
  entry.sprite.position.set(0, 0);
  entry.sprite.width = width;
  entry.sprite.height = height;
  entry.sprite.tint = tint;
  entry.sprite.alpha = 1;
}

export function configureSprite(
  sprite: Sprite,
  tint: number,
  width: number,
  height: number,
  alpha: number,
  point: { x: number; y: number },
) {
  sprite.visible = true;
  sprite.position.set(point.x, point.y);
  sprite.width = width;
  sprite.height = height;
  sprite.tint = tint;
  sprite.alpha = alpha;
}

export function resetShadowedSpriteBadge(entry: ShadowedSpriteEntry) {
  entry.badgeBackground.visible = false;
  clearGraphics(entry.badgeBackground);
  entry.badgeTrackGraphics.visible = false;
  clearGraphics(entry.badgeTrackGraphics);
  entry.badgeFillGraphics.visible = false;
  clearGraphics(entry.badgeFillGraphics);
  entry.badgePlateGraphics.visible = false;
  clearGraphics(entry.badgePlateGraphics);

  [entry.badgePrimaryText, entry.badgeSecondaryText].forEach((text) => {
    text.visible = false;
    text.text = '';
    text.alpha = 1;
    setTextPosition(text, 0, 0);
  });
}

function setTextAnchor(text: Text, value: number) {
  const anchor = (text as Text & { anchor?: { set?: (next: number) => void } })
    .anchor;
  anchor?.set?.(value);
}

export function setTextPosition(text: Text, x: number, y: number) {
  const candidate = text as Text & {
    position?: { set?: (nextX: number, nextY?: number) => void };
    x?: number;
    y?: number;
  };

  candidate.position?.set?.(x, y);
  if (typeof candidate.x === 'number') {
    candidate.x = x;
  }
  if (typeof candidate.y === 'number') {
    candidate.y = y;
  }
}

function clearGraphics(graphics: Graphics) {
  (
    graphics as Graphics & {
      clear?: () => void;
    }
  ).clear?.();
}
