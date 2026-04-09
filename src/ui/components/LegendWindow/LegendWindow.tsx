import { memo } from 'react';
import { structureIconFor } from '../../icons';
import { DraggableWindow } from '../DraggableWindow';
import type { LegendWindowProps } from './types';
import styles from './styles.module.css';

export const LegendWindow = memo(function LegendWindow({
  position,
  onMove,
  collapsed,
  onCollapsedChange,
}: LegendWindowProps) {
  return (
    <DraggableWindow
      title="Legend"
      position={position}
      onMove={onMove}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    >
      <div className={styles.legend}>
        <div className={styles.row}>
          <span className={`${styles.swatch} ${styles.plains}`} /> Plains ·
          passable
        </div>
        <div className={styles.row}>
          <span className={`${styles.swatch} ${styles.forest}`} /> Forest ·
          passable
        </div>
        <div className={styles.row}>
          <span className={`${styles.swatch} ${styles.swamp}`} /> Swamp ·
          passable
        </div>
        <div className={styles.row}>
          <span className={`${styles.swatch} ${styles.desert}`} /> Desert ·
          passable
        </div>
        <div className={styles.row}>
          <span className={`${styles.swatch} ${styles.water}`} /> Water ·
          blocked
        </div>
        <div className={styles.row}>
          <span className={`${styles.swatch} ${styles.mountain}`} /> Mountain ·
          blocked
        </div>
        <div className={styles.row}>
          <span
            className={styles.marker}
            style={iconMaskStyle(structureIconFor('town'), '#fbbf24')}
          />
          Town · sell items
        </div>
        <div className={styles.row}>
          <span
            className={styles.marker}
            style={iconMaskStyle(structureIconFor('forge'), '#f97316')}
          />
          Forge · prospect items
        </div>
        <div className={styles.row}>
          <span
            className={styles.marker}
            style={iconMaskStyle(structureIconFor('dungeon'), '#a855f7')}
          />
          Dungeon · elite enemies
        </div>
      </div>
    </DraggableWindow>
  );
});

function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
