import { memo } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import type { LegendWindowProps } from './types';
import styles from './styles.module.css';

export const LegendWindow = memo(function LegendWindow({
  position,
  onMove,
}: LegendWindowProps) {
  return (
    <DraggableWindow title="Legend" position={position} onMove={onMove}>
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
          <span className={`${styles.marker} ${styles.town}`} /> Town · sell
          items
        </div>
        <div className={styles.row}>
          <span className={`${styles.marker} ${styles.forge}`} /> Forge ·
          prospect items
        </div>
        <div className={styles.row}>
          <span className={`${styles.marker} ${styles.dungeon}`} /> Dungeon ·
          elite enemies
        </div>
      </div>
    </DraggableWindow>
  );
});
