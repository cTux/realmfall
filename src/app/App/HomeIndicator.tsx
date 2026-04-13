import { memo, useEffect, useMemo, useState, type RefObject } from 'react';
import { hexDistance, type HexCoord } from '../../game/state';
import { t } from '../../i18n';
import { getWorldHexSize, tileToPoint } from '../../ui/world/renderSceneMath';
import { WORLD_REVEAL_RADIUS } from '../constants';
import styles from './styles.module.scss';

interface HomeIndicatorProps {
  homeHex: HexCoord;
  hostRef: RefObject<HTMLDivElement | null>;
  playerCoord: HexCoord;
  radius: number;
}

export const HomeIndicator = memo(function HomeIndicator({
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

  const indicator = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return null;

    const homeDistance = hexDistance(playerCoord, homeHex);
    if (homeDistance <= WORLD_REVEAL_RADIUS) return null;

    const center = {
      x: viewportSize.width / 2,
      y: viewportSize.height / 2,
    };
    const homePoint = tileToPoint(
      {
        q: homeHex.q - playerCoord.q,
        r: homeHex.r - playerCoord.r,
      },
      center.x,
      center.y,
      getWorldHexSize(viewportSize, radius),
    );
    const vector = {
      x: homePoint.x - center.x,
      y: homePoint.y - center.y,
    };
    const magnitude = Math.hypot(vector.x, vector.y);
    if (!magnitude) return null;

    const ringScale = WORLD_REVEAL_RADIUS / homeDistance;
    const borderOffset = 18;
    const normalized = {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
    };

    return {
      angle: Math.atan2(vector.y, vector.x),
      x: center.x + vector.x * ringScale + normalized.x * borderOffset,
      y: center.y + vector.y * ringScale + normalized.y * borderOffset,
    };
  }, [homeHex, playerCoord, radius, viewportSize]);

  if (!indicator) return null;

  return (
    <div
      className={styles.homeIndicator}
      style={{
        left: indicator.x,
        top: indicator.y,
        transform: `translate(-50%, -50%) rotate(${indicator.angle + Math.PI / 2}rad)`,
      }}
      aria-label={t('app.home.directionLabel')}
    >
      <span className={styles.homeIndicatorArrow}>&#9650;</span>
      <span
        className={styles.homeIndicatorLabel}
        style={{
          transform: `translate(-50%, 0) rotate(${-indicator.angle - Math.PI / 2}rad)`,
        }}
      >
        {t('app.home.label')}
      </span>
    </div>
  );
});
