import { Container, Graphics, Sprite, Text, type TextStyle } from 'pixi.js';
import type { SceneIconTransitionLayer } from './renderSceneIconTransitions';
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
  badgeOverlayGraphics: Graphics;
  badgePlateGraphics: Graphics;
  badgePrimaryText: Text;
  badgeSecondaryText: Text;
  badgeIndicatorWrapper: Container;
  badgeIndicatorOutline: Sprite;
  badgeIndicatorShadows: Sprite[];
  badgeIndicatorSprite: Sprite;
  outline: Sprite;
  shadows: Sprite[];
  sprite: Sprite;
  transitionOutline: Sprite;
  transitionShadows: Sprite[];
  transitionSprite: Sprite;
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
    hideShadowedSpriteIconLayer({
      outline: item.transitionOutline,
      shadows: item.transitionShadows,
      sprite: item.transitionSprite,
    });
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
  hideShadowedSpriteIconLayer({
    outline: item.transitionOutline,
    shadows: item.transitionShadows,
    sprite: item.transitionSprite,
  });
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
  const badgeOverlayGraphics = new Graphics();
  const badgePlateGraphics = new Graphics();
  const badgePrimaryText = new Text({ text: '' });
  const badgeSecondaryText = new Text({ text: '' });
  const badgeIndicatorWrapper = new Container();
  const {
    outline: badgeIndicatorOutline,
    shadows: badgeIndicatorShadows,
    sprite: badgeIndicatorSprite,
  } = createShadowedSpriteIconLayer(badgeIndicatorWrapper, icon);

  setTextAnchor(badgePrimaryText, 0.5);
  setTextAnchor(badgeSecondaryText, 0.5);
  wrapper.addChild(badgeBackground);
  wrapper.addChild(badgeTrackGraphics);
  const {
    outline: transitionOutline,
    shadows: transitionShadows,
    sprite: transitionSprite,
  } = createShadowedSpriteIconLayer(wrapper, icon);
  const { outline, shadows, sprite } = createShadowedSpriteIconLayer(
    wrapper,
    icon,
  );
  wrapper.addChild(badgeFillGraphics);
  wrapper.addChild(badgeOverlayGraphics);
  wrapper.addChild(badgePlateGraphics);
  wrapper.addChild(badgePrimaryText);
  wrapper.addChild(badgeSecondaryText);
  wrapper.addChild(badgeIndicatorWrapper);
  resetShadowedSpriteBadge({
    badgeBackground,
    badgeFillGraphics,
    badgeIndicatorOutline,
    badgeIndicatorSprite,
    badgeIndicatorShadows,
    badgeIndicatorWrapper,
    badgeOverlayGraphics,
    badgePlateGraphics,
    badgePrimaryText,
    badgeSecondaryText,
    badgeTrackGraphics,
    outline,
    shadows,
    sprite,
    transitionOutline,
    transitionShadows,
    transitionSprite,
    wrapper,
  });
  hideShadowedSpriteIconLayer({
    outline: badgeIndicatorOutline,
    shadows: badgeIndicatorShadows,
    sprite: badgeIndicatorSprite,
  });
  hideShadowedSpriteIconLayer({
    outline: transitionOutline,
    shadows: transitionShadows,
    sprite: transitionSprite,
  });
  return {
    wrapper,
    badgeBackground,
    badgeTrackGraphics,
    badgeFillGraphics,
    badgeIndicatorOutline,
    badgeIndicatorSprite,
    badgeIndicatorShadows,
    badgeIndicatorWrapper,
    badgeOverlayGraphics,
    badgePlateGraphics,
    badgePrimaryText,
    badgeSecondaryText,
    outline,
    shadows,
    sprite,
    transitionOutline,
    transitionShadows,
    transitionSprite,
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
  configureShadowedSpriteWrapper(entry, alpha, point);
  configureShadowedSpriteIconLayer(
    {
      outline: entry.outline,
      shadows: entry.shadows,
      sprite: entry.sprite,
    },
    tint,
    width,
    height,
    shadowOffset,
    1,
  );
  hideShadowedSpriteIconLayer({
    outline: entry.transitionOutline,
    shadows: entry.transitionShadows,
    sprite: entry.transitionSprite,
  });
}

export function configureShadowedSpriteIconTransition(
  entry: ShadowedSpriteEntry,
  transitionLayers: SceneIconTransitionLayer[],
  width: number,
  height: number,
  alpha: number,
  shadowOffset: { x: number; y: number },
  point: { x: number; y: number },
) {
  configureShadowedSpriteWrapper(entry, alpha, point);

  const [transitionLayer, primaryLayer = transitionLayer] = transitionLayers;

  if (primaryLayer) {
    setShadowedSpriteIconLayerIcon(
      {
        outline: entry.outline,
        shadows: entry.shadows,
        sprite: entry.sprite,
      },
      primaryLayer.icon,
    );
    configureShadowedSpriteIconLayer(
      {
        outline: entry.outline,
        shadows: entry.shadows,
        sprite: entry.sprite,
      },
      primaryLayer.tint,
      width,
      height,
      shadowOffset,
      primaryLayer.alpha,
    );
  } else {
    hideShadowedSpriteIconLayer({
      outline: entry.outline,
      shadows: entry.shadows,
      sprite: entry.sprite,
    });
  }

  if (!transitionLayer || transitionLayer === primaryLayer) {
    hideShadowedSpriteIconLayer({
      outline: entry.transitionOutline,
      shadows: entry.transitionShadows,
      sprite: entry.transitionSprite,
    });
    return;
  }

  setShadowedSpriteIconLayerIcon(
    {
      outline: entry.transitionOutline,
      shadows: entry.transitionShadows,
      sprite: entry.transitionSprite,
    },
    transitionLayer.icon,
  );
  configureShadowedSpriteIconLayer(
    {
      outline: entry.transitionOutline,
      shadows: entry.transitionShadows,
      sprite: entry.transitionSprite,
    },
    transitionLayer.tint,
    width,
    height,
    shadowOffset,
    transitionLayer.alpha,
  );
}

export function setShadowedSpriteIcon(
  entry: ShadowedSpriteEntry,
  icon: string,
) {
  setShadowedSpriteIconLayerIcon(
    {
      outline: entry.outline,
      shadows: entry.shadows,
      sprite: entry.sprite,
    },
    icon,
  );
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
  sprite.rotation = 0;
}

export function resetShadowedSpriteBadge(entry: ShadowedSpriteEntry) {
  entry.badgeBackground.visible = false;
  clearGraphics(entry.badgeBackground);
  entry.badgeTrackGraphics.visible = false;
  clearGraphics(entry.badgeTrackGraphics);
  entry.badgeFillGraphics.visible = false;
  clearGraphics(entry.badgeFillGraphics);
  entry.badgeOverlayGraphics.visible = false;
  clearGraphics(entry.badgeOverlayGraphics);
  entry.badgePlateGraphics.visible = false;
  clearGraphics(entry.badgePlateGraphics);
  entry.badgeIndicatorWrapper.visible = false;
  entry.badgeIndicatorWrapper.alpha = 1;
  entry.badgeIndicatorWrapper.position.set(0, 0);
  entry.badgeIndicatorWrapper.scale.set(1, 1);
  entry.badgeIndicatorWrapper.rotation = 0;
  resetShadowedSpriteIconLayer({
    outline: entry.badgeIndicatorOutline,
    shadows: entry.badgeIndicatorShadows,
    sprite: entry.badgeIndicatorSprite,
  });

  [entry.badgePrimaryText, entry.badgeSecondaryText].forEach((text) => {
    text.visible = false;
    text.text = '';
    text.alpha = 1;
    setTextPosition(text, 0, 0);
    setTextScale(text, 1, 1);
  });
}

export function resetShadowedSpriteBadgeOverlay(entry: ShadowedSpriteEntry) {
  entry.badgeOverlayGraphics.visible = false;
  clearGraphics(entry.badgeOverlayGraphics);
}

export function configureShadowedSpriteBadgeIndicator(
  entry: ShadowedSpriteEntry,
  {
    alpha,
    icon,
    point,
    size,
    tint,
  }: {
    alpha: number;
    icon: string;
    point: { x: number; y: number };
    size: number;
    tint: number;
  },
) {
  setShadowedSpriteIconLayerIcon(
    {
      outline: entry.badgeIndicatorOutline,
      shadows: entry.badgeIndicatorShadows,
      sprite: entry.badgeIndicatorSprite,
    },
    icon,
  );
  entry.badgeIndicatorWrapper.visible = alpha > 0;
  entry.badgeIndicatorWrapper.alpha = 1;
  entry.badgeIndicatorWrapper.position.set(point.x, point.y);
  entry.badgeIndicatorWrapper.scale.set(1, 1);
  entry.badgeIndicatorWrapper.rotation = 0;
  configureShadowedSpriteIconLayer(
    {
      outline: entry.badgeIndicatorOutline,
      shadows: entry.badgeIndicatorShadows,
      sprite: entry.badgeIndicatorSprite,
    },
    tint,
    size,
    size,
    { x: 1.5, y: 1.5 },
    alpha,
  );
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

export function setTextScale(text: Text, x: number, y = x) {
  const candidate = text as Text & {
    scale?: { set?: (nextX: number, nextY?: number) => void };
  };

  candidate.scale?.set?.(x, y);
}

function createShadowedSpriteIconLayer(wrapper: Container, icon: string) {
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
  return { outline, shadows, sprite };
}

function configureShadowedSpriteWrapper(
  entry: ShadowedSpriteEntry,
  alpha: number,
  point: { x: number; y: number },
) {
  entry.wrapper.visible = true;
  entry.wrapper.alpha = alpha;
  entry.wrapper.position.set(point.x, point.y);
  entry.wrapper.scale.set(1, 1);
  entry.wrapper.rotation = 0;
}

function configureShadowedSpriteIconLayer(
  layer: {
    outline: Sprite;
    shadows: Sprite[];
    sprite: Sprite;
  },
  tint: number,
  width: number,
  height: number,
  shadowOffset: { x: number; y: number },
  alpha: number,
) {
  const outlineInsetPx = 2;
  const shadowLayers = [
    { offset: 0.3, alpha: 0.05, scale: 1.14 },
    { offset: 0.55, alpha: 0.045, scale: 1.1 },
    { offset: 0.8, alpha: 0.035, scale: 1.06 },
    { offset: 1, alpha: 0.025, scale: 1.02 },
  ];

  shadowLayers.forEach((shadowLayer, index) => {
    const shadow = layer.shadows[index];
    shadow.visible = alpha > 0;
    shadow.position.set(
      shadowOffset.x * shadowLayer.offset,
      shadowOffset.y * shadowLayer.offset,
    );
    shadow.width = width * shadowLayer.scale;
    shadow.height = height * shadowLayer.scale;
    shadow.tint = 0x000000;
    shadow.alpha = shadowLayer.alpha * alpha;
  });

  layer.outline.visible = alpha > 0;
  layer.outline.position.set(0, 0);
  layer.outline.width = width + outlineInsetPx * 2;
  layer.outline.height = height + outlineInsetPx * 2;
  layer.outline.tint = 0x000000;
  layer.outline.alpha = alpha;

  layer.sprite.visible = alpha > 0;
  layer.sprite.position.set(0, 0);
  layer.sprite.width = width;
  layer.sprite.height = height;
  layer.sprite.tint = tint;
  layer.sprite.alpha = alpha;
}

function hideShadowedSpriteIconLayer(layer: {
  outline: Sprite;
  shadows: Sprite[];
  sprite: Sprite;
}) {
  layer.shadows.forEach((shadow) => {
    shadow.visible = false;
  });
  layer.outline.visible = false;
  layer.sprite.visible = false;
}

function resetShadowedSpriteIconLayer(layer: {
  outline: Sprite;
  shadows: Sprite[];
  sprite: Sprite;
}) {
  hideShadowedSpriteIconLayer(layer);
  [layer.outline, ...layer.shadows, layer.sprite].forEach((sprite) => {
    sprite.alpha = 1;
    sprite.width = 0;
    sprite.height = 0;
    sprite.position.set(0, 0);
  });
  layer.outline.tint = 0x000000;
  layer.shadows.forEach((shadow) => {
    shadow.tint = 0x000000;
  });
  layer.sprite.tint = 0xffffff;
}

function setShadowedSpriteIconLayerIcon(
  layer: {
    outline: Sprite;
    shadows: Sprite[];
    sprite: Sprite;
  },
  icon: string,
) {
  const texture = getWorldIconTexture(icon, { allowPending: true });
  layer.outline.texture = texture;
  layer.shadows.forEach((shadow) => {
    shadow.texture = texture;
  });
  layer.sprite.texture = texture;
}

function clearGraphics(graphics: Graphics) {
  (
    graphics as Graphics & {
      clear?: () => void;
    }
  ).clear?.();
}
