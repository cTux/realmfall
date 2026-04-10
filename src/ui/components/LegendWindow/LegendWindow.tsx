import { memo } from 'react';
import { structureIconFor } from '../../icons';
import { DraggableWindow } from '../DraggableWindow';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { LegendWindowProps } from './types';
import styles from './styles.module.css';

export const LegendWindow = memo(function LegendWindow({
  position,
  onMove,
  visible,
  onClose,
}: LegendWindowProps) {
  return (
    <DraggableWindow
      title={renderWindowLabel(WINDOW_LABELS.legend, labelStyles.hotkey)}
      position={position}
      onMove={onMove}
      visible={visible}
      onClose={onClose}
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
        <div className={styles.row}>
          <span
            className={styles.marker}
            style={iconMaskStyle(structureIconFor('tree'), '#22c55e')}
          />
          Tree · logging, logs
        </div>
        <div className={styles.row}>
          <span
            className={styles.marker}
            style={iconMaskStyle(structureIconFor('iron-ore'), '#94a3b8')}
          />
          Ore vein · mining, ore
        </div>
        <div className={styles.row}>
          <span
            className={styles.marker}
            style={iconMaskStyle(structureIconFor('lake'), '#2563eb')}
          />
          Pond or lake · fishing, raw fish
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
