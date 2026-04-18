import { useEffect, useState } from 'react';
import { APP_VERSION } from '../../../version';

export const VERSION_POLL_INTERVAL_MS = 5 * 60_000;

export type VersionStatusState =
  | {
      currentVersion: string;
      remoteVersion: string | null;
      status: 'fetching';
    }
  | {
      currentVersion: string;
      remoteVersion: string;
      status: 'current' | 'outdated';
    };

function getVersionJsonUrl() {
  return new URL(
    `${import.meta.env.BASE_URL}version.json`,
    window.location.origin,
  ).toString();
}

function isVersionPayload(value: unknown): value is { version: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    typeof value.version === 'string'
  );
}

function getResolvedStatus(remoteVersion: string, currentVersion: string) {
  return remoteVersion === currentVersion ? 'current' : 'outdated';
}

export function useVersionStatus(currentVersion = APP_VERSION) {
  const [state, setState] = useState<VersionStatusState>({
    currentVersion,
    remoteVersion: null,
    status: 'fetching',
  });

  useEffect(() => {
    let disposed = false;
    let interval: number | null = null;

    const stopPolling = () => {
      if (interval != null) {
        window.clearInterval(interval);
        interval = null;
      }
    };

    const syncVersion = async (showFetchingState: boolean) => {
      setState((current) => {
        if (current.remoteVersion !== null) {
          return {
            currentVersion,
            remoteVersion: current.remoteVersion,
            status: getResolvedStatus(current.remoteVersion, currentVersion),
          };
        }

        if (!showFetchingState) {
          return current;
        }

        return {
          currentVersion,
          remoteVersion: null,
          status: 'fetching',
        };
      });

      try {
        const response = await fetch(getVersionJsonUrl(), {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Unexpected version response: ${response.status}`);
        }

        const payload: unknown = await response.json();

        if (!isVersionPayload(payload)) {
          throw new Error('Invalid version payload.');
        }

        if (disposed) {
          return;
        }

        setState({
          currentVersion,
          remoteVersion: payload.version,
          status: getResolvedStatus(payload.version, currentVersion),
        });
      } catch {
        if (disposed) {
          return;
        }

        setState((current) =>
          current.remoteVersion === null
            ? {
                currentVersion,
                remoteVersion: null,
                status: 'fetching',
              }
            : {
                currentVersion,
                remoteVersion: current.remoteVersion,
                status: getResolvedStatus(
                  current.remoteVersion,
                  currentVersion,
                ),
              },
        );
      }
    };

    const startPolling = () => {
      if (interval != null || document.visibilityState === 'hidden') {
        return;
      }

      interval = window.setInterval(() => {
        void syncVersion(false);
      }, VERSION_POLL_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
        return;
      }

      void syncVersion(false);
      startPolling();
    };

    void syncVersion(true);
    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVersion]);

  return state;
}
