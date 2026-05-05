import { ENEMY_LEVEL_LABEL_STYLE } from './renderSceneCache';
import {
  configureShadowedSprite,
  resetShadowedSpriteBadge,
  setTextPosition,
  type ShadowedSpriteEntry,
} from './renderScenePools';

const ENTITY_BADGE_BORDER_COLOR = 0x020617;
const ENTITY_BADGE_PLATE_FILL = 0xf8fafc;
const ENTITY_BADGE_BACKGROUND_ALPHA = 0.94;
const ENTITY_BADGE_ARC_ALPHA = 0.98;
const ENTITY_BADGE_ARC_TRACK_ALPHA = 0.94;
const ENTITY_BADGE_ARC_INSET = 2;
const ENTITY_BADGE_MIN_ARC_THICKNESS = 4;
const ENTITY_BADGE_ARC_THICKNESS_RATIO = 0.18;
const ENTITY_BADGE_PLATE_HEIGHT_RATIO = 0.34;
const ENTITY_BADGE_MIN_PLATE_HEIGHT = 16;
const ENTITY_BADGE_PLATE_TEXT_PADDING = 12;

export const ENTITY_BADGE_BACKGROUND_COLORS = {
  default: 0x22c55e,
  enemy: 0xef4444,
  player: 0x22d3ee,
} as const;

export const ENTITY_BADGE_HP_FILL_COLOR = 0xff2d55;
export const ENTITY_BADGE_HP_TRACK_COLOR = 0x7f1d1d;
export const ENTITY_BADGE_MP_FILL_COLOR = 0x38bdf8;
export const ENTITY_BADGE_MP_TRACK_COLOR = 0x1e40af;

interface EntityBadgeOptions {
  alpha: number;
  backgroundColor: number;
  countLabel?: string;
  hp: {
    current: number;
    max: number;
  };
  iconSize: number;
  iconTint: number;
  levelLabel?: string;
  mana: {
    current: number;
    max: number;
  };
  outerRadius: number;
  point: { x: number; y: number };
  shadowOffset: { x: number; y: number };
}

interface EntityBadgeDecorationOptions {
  alpha: number;
  backgroundColor: number;
  countLabel?: string;
  hp: {
    current: number;
    max: number;
  };
  levelLabel?: string;
  mana: {
    current: number;
    max: number;
  };
  outerRadius: number;
}

export function configureEntityBadgeSprite(
  entry: ShadowedSpriteEntry,
  {
    alpha,
    backgroundColor,
    countLabel,
    hp,
    iconSize,
    iconTint,
    levelLabel,
    mana,
    outerRadius,
    point,
    shadowOffset,
  }: EntityBadgeOptions,
) {
  configureShadowedSprite(
    entry,
    iconTint,
    iconSize,
    iconSize,
    alpha,
    shadowOffset,
    point,
  );
  decorateEntityBadge(entry, {
    alpha,
    backgroundColor,
    countLabel,
    hp,
    levelLabel,
    mana,
    outerRadius,
  });
}

export function decorateEntityBadge(
  entry: ShadowedSpriteEntry,
  {
    alpha,
    backgroundColor,
    countLabel,
    hp,
    levelLabel,
    mana,
    outerRadius,
  }: EntityBadgeDecorationOptions,
) {
  resetShadowedSpriteBadge(entry);

  entry.badgeBackground.visible = true;
  entry.badgeBackground
    .ellipse(0, 0, outerRadius, outerRadius)
    .fill({
      alpha: alpha * ENTITY_BADGE_BACKGROUND_ALPHA,
      color: backgroundColor,
    })
    .stroke({
      alpha,
      color: ENTITY_BADGE_BORDER_COLOR,
      width: 2,
    });

  const ringOuterRadius = Math.max(outerRadius - ENTITY_BADGE_ARC_INSET, 1);
  const ringInnerRadius = Math.max(
    1,
    ringOuterRadius -
      Math.max(
        ENTITY_BADGE_MIN_ARC_THICKNESS,
        outerRadius * ENTITY_BADGE_ARC_THICKNESS_RATIO,
      ),
  );

  drawBadgeArc(entry.badgeTrackGraphics, {
    alpha: alpha * ENTITY_BADGE_ARC_TRACK_ALPHA,
    color: ENTITY_BADGE_HP_TRACK_COLOR,
    endAngle: Math.PI * 2,
    innerRadius: ringInnerRadius,
    outerRadius: ringOuterRadius,
    progress: 1,
    startAngle: Math.PI,
  });
  drawBadgeArc(entry.badgeTrackGraphics, {
    alpha: alpha * ENTITY_BADGE_ARC_TRACK_ALPHA,
    color: ENTITY_BADGE_MP_TRACK_COLOR,
    endAngle: 0,
    innerRadius: ringInnerRadius,
    outerRadius: ringOuterRadius,
    progress: 1,
    startAngle: Math.PI,
  });

  const hpProgress = getResourceProgress(hp.current, hp.max);
  if (hpProgress > 0) {
    drawBadgeArc(entry.badgeFillGraphics, {
      alpha: alpha * ENTITY_BADGE_ARC_ALPHA,
      color: ENTITY_BADGE_HP_FILL_COLOR,
      endAngle: Math.PI * 2,
      innerRadius: ringInnerRadius,
      outerRadius: ringOuterRadius,
      progress: hpProgress,
      startAngle: Math.PI,
    });
  }

  const manaProgress = getResourceProgress(mana.current, mana.max);
  if (manaProgress > 0) {
    drawBadgeArc(entry.badgeFillGraphics, {
      alpha: alpha * ENTITY_BADGE_ARC_ALPHA,
      color: ENTITY_BADGE_MP_FILL_COLOR,
      endAngle: 0,
      innerRadius: ringInnerRadius,
      outerRadius: ringOuterRadius,
      progress: manaProgress,
      startAngle: Math.PI,
    });
  }

  if (levelLabel) {
    renderBadgePlate(entry.badgePlateGraphics, entry.badgePrimaryText, {
      alpha,
      label: levelLabel,
      outerRadius,
      placement: 'top',
    });
  }

  if (countLabel) {
    renderBadgePlate(entry.badgePlateGraphics, entry.badgeSecondaryText, {
      alpha,
      label: countLabel,
      outerRadius,
      placement: 'bottom',
    });
  }
}

function renderBadgePlate(
  graphics: ShadowedSpriteEntry['badgePlateGraphics'],
  text: ShadowedSpriteEntry['badgePrimaryText'],
  {
    alpha,
    label,
    outerRadius,
    placement,
  }: {
    alpha: number;
    label: string;
    outerRadius: number;
    placement: 'bottom' | 'top';
  },
) {
  const plateHeight = Math.max(
    ENTITY_BADGE_MIN_PLATE_HEIGHT,
    outerRadius * ENTITY_BADGE_PLATE_HEIGHT_RATIO,
  );
  const plateWidth = Math.max(
    plateHeight * 1.2,
    label.length * 7 + ENTITY_BADGE_PLATE_TEXT_PADDING,
  );
  const plateY =
    placement === 'top'
      ? -outerRadius - plateHeight * 0.65
      : outerRadius - plateHeight * 0.35;

  graphics.visible = true;
  graphics
    .rect(-plateWidth / 2, plateY, plateWidth, plateHeight)
    .fill({
      alpha,
      color: ENTITY_BADGE_PLATE_FILL,
    })
    .stroke({
      alpha,
      color: ENTITY_BADGE_BORDER_COLOR,
      width: 2,
    });

  text.visible = true;
  text.style = ENEMY_LEVEL_LABEL_STYLE;
  text.text = label;
  text.alpha = alpha;
  setTextPosition(text, 0, plateY + plateHeight / 2);
}

function drawBadgeArc(
  graphics: ShadowedSpriteEntry['badgeTrackGraphics'],
  {
    alpha,
    color,
    endAngle,
    innerRadius,
    outerRadius,
    progress,
    startAngle,
  }: {
    alpha: number;
    color: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    progress: number;
    startAngle: number;
  },
) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  if (clampedProgress <= 0) {
    return;
  }

  const arcEndAngle = startAngle + (endAngle - startAngle) * clampedProgress;
  const points = buildRingArcPolygon({
    endAngle: arcEndAngle,
    innerRadius,
    outerRadius,
    startAngle,
  });

  graphics.visible = true;
  graphics.poly(points).fill({ alpha, color });
}

function buildRingArcPolygon({
  endAngle,
  innerRadius,
  outerRadius,
  startAngle,
}: {
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
}) {
  const arcLength = Math.abs(endAngle - startAngle);
  const segmentCount = Math.max(12, Math.ceil(arcLength / (Math.PI / 12)));
  const outerPoints: number[] = [];
  const innerPoints: number[] = [];

  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const angle = startAngle + (endAngle - startAngle) * progress;
    outerPoints.push(
      Math.cos(angle) * outerRadius,
      Math.sin(angle) * outerRadius,
    );
  }

  for (let index = segmentCount; index >= 0; index -= 1) {
    const progress = index / segmentCount;
    const angle = startAngle + (endAngle - startAngle) * progress;
    innerPoints.push(
      Math.cos(angle) * innerRadius,
      Math.sin(angle) * innerRadius,
    );
  }

  return [...outerPoints, ...innerPoints];
}

function getResourceProgress(current: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, current / max));
}
