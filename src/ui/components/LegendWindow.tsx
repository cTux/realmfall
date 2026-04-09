import type { WindowPosition } from '../../app/constants';
import { DraggableWindow } from './DraggableWindow';
import styles from './LegendWindow.module.css';

interface LegendWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
}

export function LegendWindow({ position, onMove }: LegendWindowProps) {
  return (
    <DraggableWindow title="Legend" position={position} onMove={onMove}>
      <div className={styles.legend}>
        <div>
          <span className={`${styles.swatch} ${styles.plains}`} /> Plains ·
          passable
        </div>
        <div>
          <span className={`${styles.swatch} ${styles.forest}`} /> Forest ·
          passable
        </div>
        <div>
          <span className={`${styles.swatch} ${styles.swamp}`} /> Swamp ·
          passable
        </div>
        <div>
          <span className={`${styles.swatch} ${styles.desert}`} /> Desert ·
          passable
        </div>
        <div>
          <span className={`${styles.swatch} ${styles.water}`} /> Water ·
          blocked
        </div>
        <div>
          <span className={`${styles.swatch} ${styles.mountain}`} /> Mountain ·
          blocked
        </div>
      </div>
    </DraggableWindow>
  );
}
