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
  outline: Sprite;
  shadows: Sprite[];
  sprite: Sprite;
}

export interface ShadowedSpritePool {
  parent: Container;
  itemsByIcon: Map<string, ShadowedSpriteEntry[]>;
  usedByIcon: Map<string, number>;
}

export interface SpritePool {
  parent: Container;
  itemsByIcon: Map<string, Sprite[]>;
  usedByIcon: Map<string, number>;
}

export interface MaskedSpriteEntry {
  mask: Graphics;
  sprite: Sprite;
  wrapper: Container;
}

export interface MaskedSpritePool {
  parent: Container;
  itemsByIcon: Map<string, MaskedSpriteEntry[]>;
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
  return { parent, itemsByIcon: new Map(), usedByIcon: new Map() };
}

export function resetShadowedSpritePool(pool: ShadowedSpritePool) {
  pool.usedByIcon.clear();
}

export function takeShadowedSprite(pool: ShadowedSpritePool, icon: string) {
  const items = pool.itemsByIcon.get(icon) ?? [];
  const used = pool.usedByIcon.get(icon) ?? 0;
  const texture = getWorldIconTexture(icon, { allowPending: true });

  let item = items[used];
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
  item.wrapper.visible = true;
  pool.usedByIcon.set(icon, used + 1);
  return item;
}

export function finishShadowedSpritePool(pool: ShadowedSpritePool) {
  pool.itemsByIcon.forEach((items, icon) => {
    const used = pool.usedByIcon.get(icon) ?? 0;
    for (let index = used; index < items.length; index += 1) {
      items[index].wrapper.visible = false;
    }
  });
}

export function createSpritePool(parent: Container): SpritePool {
  return { parent, itemsByIcon: new Map(), usedByIcon: new Map() };
}

export function createMaskedSpritePool(parent: Container): MaskedSpritePool {
  return { parent, itemsByIcon: new Map(), usedByIcon: new Map() };
}

export function resetSpritePool(pool: SpritePool) {
  pool.usedByIcon.clear();
}

export function resetMaskedSpritePool(pool: MaskedSpritePool) {
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

export function takeMaskedSprite(pool: MaskedSpritePool, icon: string) {
  const items = pool.itemsByIcon.get(icon) ?? [];
  const used = pool.usedByIcon.get(icon) ?? 0;
  const texture = getWorldIconTexture(icon, { allowPending: true });

  let item = items[used];
  if (!item) {
    item = createMaskedSprite(icon);
    items.push(item);
    pool.itemsByIcon.set(icon, items);
    pool.parent.addChild(item.wrapper);
  }

  item.sprite.texture = texture;
  item.wrapper.visible = true;
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

export function finishMaskedSpritePool(pool: MaskedSpritePool) {
  pool.itemsByIcon.forEach((items, icon) => {
    const used = pool.usedByIcon.get(icon) ?? 0;
    for (let index = used; index < items.length; index += 1) {
      items[index].wrapper.visible = false;
      items[index].mask.clear();
    }
  });
}

export function createShadowedSprite(icon: string): ShadowedSpriteEntry {
  const wrapper = new Container();
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
  return { wrapper, outline, shadows, sprite };
}

export function createMaskedSprite(icon: string): MaskedSpriteEntry {
  const wrapper = new Container();
  const sprite = new Sprite(getWorldIconTexture(icon, { allowPending: true }));
  sprite.anchor.set(0.5);
  const mask = new Graphics();
  mask.renderable = false;
  sprite.mask = mask;
  wrapper.addChild(sprite, mask);
  return { mask, sprite, wrapper };
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

export function configureMaskedSprite(
  entry: MaskedSpriteEntry,
  tint: number,
  width: number,
  height: number,
  alpha: number,
  point: { x: number; y: number },
  maskPoints: number[],
) {
  entry.wrapper.visible = true;
  entry.wrapper.position.set(point.x, point.y);
  entry.wrapper.scale.set(1, 1);
  entry.wrapper.rotation = 0;

  entry.sprite.visible = true;
  entry.sprite.position.set(0, 0);
  entry.sprite.width = width;
  entry.sprite.height = height;
  entry.sprite.tint = tint;
  entry.sprite.alpha = alpha;

  entry.mask.visible = true;
  entry.mask.renderable = false;
  entry.mask.clear();
  entry.mask.poly(maskPoints).fill({ color: 0xffffff, alpha: 1 });
}
