import { memo, useEffect, useMemo, useState, type RefObject } from 'react';
import { hexDistance, type HexCoord } from '../../game/hex';
import { t } from '../../i18n';
import { getWorldHexSize, tileToPoint } from '../../ui/world/renderSceneMath';
import { WORLD_REVEAL_RADIUS } from '../constants';
import styles from './styles.module.scss';

interface HomeIndicatorProps {
  claimedHex?: HexCoord | null;
  homeHex: HexCoord;
  hostRef: RefObject<HTMLDivElement | null>;
  playerCoord: HexCoord;
  radius: number;
}

export const HomeIndicator = memo(function HomeIndicator({
  claimedHex = null,
  homeHex,
  hostRef,
  playerCoord,
  radius,
}: HomeIndicatorProps) {
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const updateViewportSize = () => {
      setViewportSize({
        width: host.clientWidth,
        height: host.clientHeight,
      });
    };

    updateViewportSize();
    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(host);
    return () => observer.disconnect();
  }, [hostRef]);

  const indicators = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return [];
    const center = {
      x: viewportSize.width / 2,
      y: viewportSize.height / 2,
    };
    const seenTargets = new Set<string>();
    const targets = [
      {
        ariaLabelKey: 'app.home.directionLabel',
        coord: homeHex,
        key: 'home',
        labelKey: 'app.home.label',
        tone: 'home' as const,
      },
      claimedHex
        ? {
            ariaLabelKey: 'app.claimed.directionLabel',
            coord: claimedHex,
            key: 'claimed',
            labelKey: 'app.claimed.label',
            tone: 'claim' as const,
          }
        : null,
    ].filter((target): target is NonNullable<typeof target> => {
      if (!target) return false;
      const targetKey = `${target.coord.q},${target.coord.r}`;
      if (seenTargets.has(targetKey)) return false;
      seenTargets.add(targetKey);
      return true;
    });

    return targets.flatMap((target, index) => {
      const targetDistance = hexDistance(playerCoord, target.coord);
      if (targetDistance <= WORLD_REVEAL_RADIUS) return [];

      const targetPoint = tileToPoint(
        {
          q: target.coord.q - playerCoord.q,
          r: target.coord.r - playerCoord.r,
        },
        center.x,
        center.y,
        getWorldHexSize(viewportSize, radius),
      );
      const vector = {
        x: targetPoint.x - center.x,
        y: targetPoint.y - center.y,
      };
      const magnitude = Math.hypot(vector.x, vector.y);
      if (!magnitude) return [];

      const ringScale = WORLD_REVEAL_RADIUS / targetDistance;
      const borderOffset = 18 + index * 24;
      const normalized = {
        x: vector.x / magnitude,
        y: vector.y / magnitude,
      };

      return {
        angle: Math.atan2(vector.y, vector.x),
        ariaLabelKey: target.ariaLabelKey,
        key: target.key,
        labelKey: target.labelKey,
        tone: target.tone,
        x: center.x + vector.x * ringScale + normalized.x * borderOffset,
        y: center.y + vector.y * ringScale + normalized.y * borderOffset,
      };
    });
  }, [claimedHex, homeHex, playerCoord, radius, viewportSize]);

  if (indicators.length === 0) return null;

  return indicators.map((indicator) => (
    <div
      key={indicator.key}
      className={styles.homeIndicator}
      style={{
        left: indicator.x,
        top: indicator.y,
        transform: `translate(-50%, -50%) rotate(${indicator.angle + Math.PI / 2}rad)`,
      }}
      aria-label={t(indicator.ariaLabelKey)}
    >
      <span
        className={[
          styles.homeIndicatorArrow,
          indicator.tone === 'claim' ? styles.claimIndicatorArrow : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        &#9650;
      </span>
      <span
        className={[
          styles.homeIndicatorLabel,
          indicator.tone === 'claim' ? styles.claimIndicatorLabel : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          transform: `translate(-50%, 0) rotate(${-indicator.angle - Math.PI / 2}rad)`,
        }}
      >
        {t(indicator.labelKey)}
      </span>
    </div>
  ));
});
