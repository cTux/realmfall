import { getEnemyLevelLabelStyle } from './renderSceneCache';
import {
  configureShadowedSprite,
  resetShadowedSpriteBadge,
  setTextPosition,
  setTextScale,
  type ShadowedSpriteEntry,
} from './renderScenePools';

const ENTITY_BADGE_PLATE_FILL = 0x000000;
const ENTITY_BADGE_BACKGROUND_ALPHA = 0.94;
const ENTITY_BADGE_ARC_ALPHA = 0.98;
const ENTITY_BADGE_ARC_TRACK_ALPHA = 0.94;
const ENTITY_BADGE_ARC_INSET = 0;
const ENTITY_BADGE_MIN_ARC_THICKNESS = 2;
const ENTITY_BADGE_ARC_THICKNESS_RATIO = 0.09;
const ENTITY_BADGE_PLATE_HEIGHT_RATIO = 0.18;
const ENTITY_BADGE_MIN_PLATE_HEIGHT = 8;
const ENTITY_BADGE_PLATE_TEXT_PADDING = 6;
const ENTITY_BADGE_PLATE_CHAR_WIDTH = 4;
const ENTITY_BADGE_PLATE_TEXT_SCALE = 0.55;
const ENTITY_BADGE_BORDER_COLOR = 0x000000;

export const ENTITY_BADGE_RADIUS_SCALE = 0.9;
export const ENTITY_BADGE_STRUCTURE_BACKGROUND_ALPHA = 0.4;
export const ENTITY_BADGE_STRUCTURE_BORDER_WIDTH = 1;
export const ENTITY_BADGE_HP_ARC_ANGLES = {
  endAngle: Math.PI * 2,
  startAngle: Math.PI,
} as const;
export const ENTITY_BADGE_MP_ARC_ANGLES = {
  endAngle: 0,
  startAngle: Math.PI,
} as const;

export const ENTITY_BADGE_BACKGROUND_COLORS = {
  default: 0x123524,
  enemy: 0x2a0505,
  player: 0x4ade80,
  structure: 0x082f49,
} as const;

export const ENTITY_BADGE_HP_FILL_COLOR = 0xff2d55;
export const ENTITY_BADGE_HP_TRACK_COLOR = 0x450a0a;
export const ENTITY_BADGE_MP_FILL_COLOR = 0x38bdf8;
export const ENTITY_BADGE_MP_TRACK_COLOR = 0x172554;

export interface EntityBadgeArcBand {
  innerRadius: number;
  outerRadius: number;
  thickness: number;
}

interface EntityBadgeOptions {
  alpha: number;
  backgroundColor: number;
  backgroundAlpha?: number;
  borderColor?: number;
  borderWidth?: number;
  countLabel?: string;
  hp?: {
    current: number;
    max: number;
  };
  iconSize: number;
  iconTint: number;
  levelLabel?: string;
  mana?: {
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
  backgroundAlpha?: number;
  borderColor?: number;
  borderWidth?: number;
  countLabel?: string;
  hp?: {
    current: number;
    max: number;
  };
  levelLabel?: string;
  mana?: {
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
    backgroundAlpha,
    borderColor,
    borderWidth,
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
    backgroundAlpha,
    borderColor,
    borderWidth,
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
    backgroundAlpha,
    borderColor,
    borderWidth,
    countLabel,
    hp,
    levelLabel,
    mana,
    outerRadius,
  }: EntityBadgeDecorationOptions,
) {
  resetShadowedSpriteBadge(entry);

  entry.badgeBackground.visible = true;
  const background = entry.badgeBackground
    .ellipse(0, 0, outerRadius, outerRadius)
    .fill({
      alpha: alpha * (backgroundAlpha ?? ENTITY_BADGE_BACKGROUND_ALPHA),
      color: backgroundColor,
    });
  if ((borderWidth ?? 0) > 0) {
    background.stroke({
      alpha,
      color: borderColor ?? ENTITY_BADGE_BORDER_COLOR,
      width: borderWidth,
    });
  }

  const resourceArcBand = getEntityBadgeArcBand(outerRadius);
  if (hp && mana) {
    drawEntityBadgeArc(entry.badgeTrackGraphics, {
      alpha: alpha * ENTITY_BADGE_ARC_TRACK_ALPHA,
      color: ENTITY_BADGE_HP_TRACK_COLOR,
      endAngle: ENTITY_BADGE_HP_ARC_ANGLES.endAngle,
      innerRadius: resourceArcBand.innerRadius,
      outerRadius: resourceArcBand.outerRadius,
      progress: 1,
      startAngle: ENTITY_BADGE_HP_ARC_ANGLES.startAngle,
    });
    drawEntityBadgeArc(entry.badgeTrackGraphics, {
      alpha: alpha * ENTITY_BADGE_ARC_TRACK_ALPHA,
      color: ENTITY_BADGE_MP_TRACK_COLOR,
      endAngle: ENTITY_BADGE_MP_ARC_ANGLES.endAngle,
      innerRadius: resourceArcBand.innerRadius,
      outerRadius: resourceArcBand.outerRadius,
      progress: 1,
      startAngle: ENTITY_BADGE_MP_ARC_ANGLES.startAngle,
    });

    const hpProgress = getResourceProgress(hp.current, hp.max);
    if (hpProgress > 0) {
      drawEntityBadgeArc(entry.badgeFillGraphics, {
        alpha: alpha * ENTITY_BADGE_ARC_ALPHA,
        color: ENTITY_BADGE_HP_FILL_COLOR,
        endAngle: ENTITY_BADGE_HP_ARC_ANGLES.endAngle,
        innerRadius: resourceArcBand.innerRadius,
        outerRadius: resourceArcBand.outerRadius,
        progress: hpProgress,
        startAngle: ENTITY_BADGE_HP_ARC_ANGLES.startAngle,
      });
    }

    const manaProgress = getResourceProgress(mana.current, mana.max);
    if (manaProgress > 0) {
      drawEntityBadgeArc(entry.badgeFillGraphics, {
        alpha: alpha * ENTITY_BADGE_ARC_ALPHA,
        color: ENTITY_BADGE_MP_FILL_COLOR,
        endAngle: ENTITY_BADGE_MP_ARC_ANGLES.endAngle,
        innerRadius: resourceArcBand.innerRadius,
        outerRadius: resourceArcBand.outerRadius,
        progress: manaProgress,
        startAngle: ENTITY_BADGE_MP_ARC_ANGLES.startAngle,
      });
    }
  }

  if (levelLabel) {
    renderBadgePlate(entry.badgePlateGraphics, entry.badgePrimaryText, {
      alpha,
      label: levelLabel,
      outerRadius,
      placement: 'top',
      ringInnerRadius: resourceArcBand.innerRadius,
    });
  }

  if (countLabel) {
    renderBadgePlate(entry.badgePlateGraphics, entry.badgeSecondaryText, {
      alpha,
      label: countLabel,
      outerRadius,
      placement: 'bottom',
      ringInnerRadius: resourceArcBand.innerRadius,
    });
  }
}

export function getEntityBadgeArcBand(outerRadius: number): EntityBadgeArcBand {
  const resolvedOuterRadius = Math.max(outerRadius - ENTITY_BADGE_ARC_INSET, 1);
  const thickness = Math.max(
    ENTITY_BADGE_MIN_ARC_THICKNESS,
    outerRadius * ENTITY_BADGE_ARC_THICKNESS_RATIO,
  );

  return {
    innerRadius: Math.max(1, resolvedOuterRadius - thickness),
    outerRadius: resolvedOuterRadius,
    thickness,
  };
}

export function expandEntityBadgeArcBand(
  band: EntityBadgeArcBand,
  gap: number,
  thickness = band.thickness,
): EntityBadgeArcBand {
  const innerRadius = band.outerRadius + Math.max(0, gap);
  return {
    innerRadius,
    outerRadius: innerRadius + Math.max(1, thickness),
    thickness: Math.max(1, thickness),
  };
}

function renderBadgePlate(
  graphics: ShadowedSpriteEntry['badgePlateGraphics'],
  text: ShadowedSpriteEntry['badgePrimaryText'],
  {
    alpha,
    label,
    outerRadius,
    placement,
    ringInnerRadius,
  }: {
    alpha: number;
    label: string;
    outerRadius: number;
    placement: 'bottom' | 'top';
    ringInnerRadius: number;
  },
) {
  const plateHeight = Math.max(
    ENTITY_BADGE_MIN_PLATE_HEIGHT,
    outerRadius * ENTITY_BADGE_PLATE_HEIGHT_RATIO,
  );
  const plateWidth = Math.max(
    plateHeight * 1.2,
    label.length * ENTITY_BADGE_PLATE_CHAR_WIDTH +
      ENTITY_BADGE_PLATE_TEXT_PADDING,
  );
  const ringCenterRadius = (outerRadius + ringInnerRadius) / 2;
  const plateCenterY = (placement === 'top' ? -1 : 1) * ringCenterRadius;
  const plateY = plateCenterY - plateHeight / 2;

  graphics.visible = true;
  graphics.rect(-plateWidth / 2, plateY, plateWidth, plateHeight).fill({
    alpha,
    color: ENTITY_BADGE_PLATE_FILL,
  });

  text.visible = true;
  text.style = getEnemyLevelLabelStyle();
  text.text = label;
  text.alpha = alpha;
  setTextScale(
    text,
    ENTITY_BADGE_PLATE_TEXT_SCALE,
    ENTITY_BADGE_PLATE_TEXT_SCALE,
  );
  setTextPosition(text, 0, plateCenterY);
}

export function drawEntityBadgeArc(
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
