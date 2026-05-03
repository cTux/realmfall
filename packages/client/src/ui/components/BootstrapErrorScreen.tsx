import { LoadingSpinner } from '@realmfall/ui/loading-spinner';
import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import styles from './BootstrapErrorScreen.module.scss';

export const BOOTSTRAP_ERROR_RELOAD_DELAY_MS = 2000;
const BOOTSTRAP_ERROR_RELOAD_DELAY_SECONDS =
  BOOTSTRAP_ERROR_RELOAD_DELAY_MS / 1000;

type BootstrapErrorScreenProps = {
  reloadPage?: () => void;
};

const BOOTSTRAP_ERROR_COPY = {
  title: 'Realmfall failed to load.',
  countdown: 'Trying to recover automatically in {seconds} sec.',
};

export function BootstrapErrorScreen({
  reloadPage = reloadCurrentPage,
}: BootstrapErrorScreenProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(
    BOOTSTRAP_ERROR_RELOAD_DELAY_SECONDS,
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsRemaining((currentSeconds) =>
        currentSeconds > 1 ? currentSeconds - 1 : currentSeconds,
      );
    }, 1000);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      reloadPage();
    }, BOOTSTRAP_ERROR_RELOAD_DELAY_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [reloadPage]);

  return (
    <div aria-live="assertive" role="alert" className={styles.screen}>
      <div className={styles.content}>
        <LoadingSpinner />
        <strong className={styles.title}>
          {translateBootstrapCopy(
            'ui.loading.bootstrapErrorTitle',
            BOOTSTRAP_ERROR_COPY.title,
          )}
        </strong>
        <p className={styles.message}>
          {translateBootstrapCopy(
            'ui.loading.bootstrapRetryCountdown',
            BOOTSTRAP_ERROR_COPY.countdown,
            { seconds: secondsRemaining },
          )}
        </p>
      </div>
    </div>
  );
}

function reloadCurrentPage() {
  window.location.reload();
}

function translateBootstrapCopy(
  key: string,
  fallback: string,
  params?: Record<string, number>,
) {
  const translated = t(key, params);

  if (translated === key) {
    return interpolate(fallback, params);
  }

  return translated;
}

function interpolate(template: string, params?: Record<string, number>) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value == null ? `{${token}}` : String(value);
  });
}
