import { memo } from 'react';
import styles from './styles.module.scss';

interface SwitchProps {
  checked: boolean;
  description?: string;
  label: string;
  onChange: (checked: boolean) => void;
}

export const Switch = memo(function Switch({
  checked,
  description,
  label,
  onChange,
}: SwitchProps) {
  return (
    <label className={styles.switch} data-ui-audio-hover="true">
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description ? (
          <span className={styles.description}>{description}</span>
        ) : null}
      </span>
      <span className={styles.control}>
        <input
          className={styles.input}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </span>
    </label>
  );
});
