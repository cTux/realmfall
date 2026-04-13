import FPSStats from 'react-fps-stats';
import { t } from '../../../i18n';
import type { DebuggerWindowProps } from './types';
import styles from './styles.module.scss';

type DebuggerWindowContentProps = Pick<
  DebuggerWindowProps,
  'timeLabel' | 'onTriggerEarthshake'
>;

export function DebuggerWindowContent({
  timeLabel,
  onTriggerEarthshake,
}: DebuggerWindowContentProps) {
  return (
    <div className={styles.panel} aria-label={t('ui.window.worldTime.plain')}>
      <strong className={styles.time}>{timeLabel}</strong>
      <button
        type="button"
        className={styles.button}
        onClick={onTriggerEarthshake}
      >
        {t('ui.debugger.triggerEarthshake')}
      </button>
      <div className={styles.graph}>
        <FPSStats
          top="auto"
          left="auto"
          right="auto"
          bottom="auto"
          graphWidth={220}
          graphHeight={72}
        />
      </div>
    </div>
  );
}
