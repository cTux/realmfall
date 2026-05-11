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
  title: 'ui.loading.bootstrapErrorTitle',
  countdown: 'ui.loading.bootstrapRetryCountdown',
};

const FALLBACK_COPY = {
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
        <span aria-hidden="true" className={styles.loadingSpinner} />
        <strong className={styles.title}>
          {resolveCopy(BOOTSTRAP_ERROR_COPY.title, FALLBACK_COPY.title)}
        </strong>
        <p className={styles.message}>
          {resolveCopy(
            BOOTSTRAP_ERROR_COPY.countdown,
            FALLBACK_COPY.countdown,
            {
              seconds: secondsRemaining,
            },
          )}
        </p>
      </div>
    </div>
  );
}

function reloadCurrentPage() {
  window.location.reload();
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

function resolveCopy(
  key: string,
  fallback: string,
  params?: Record<string, number>,
) {
  const translation = t(key);
  return interpolationFromTranslation(
    translation === key ? fallback : translation,
    params,
  );
}

function interpolationFromTranslation(
  template: string,
  params?: Record<string, number>,
) {
  return interpolate(template, params);
}
