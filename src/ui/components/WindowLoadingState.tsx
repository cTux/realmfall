import styles from './WindowLoadingState.module.css';

export function WindowLoadingState() {
  return (
    <div className={styles.loadingState} aria-live="polite" aria-busy="true">
      <div className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
