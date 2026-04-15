import { useEffect, useState } from 'react';
import { APP_VERSION } from '../../../version';

export const VERSION_POLL_INTERVAL_MS = 15_000;

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

export function useVersionStatus(currentVersion = APP_VERSION) {
  const [state, setState] = useState<VersionStatusState>({
    currentVersion,
    remoteVersion: null,
    status: 'fetching',
  });

  useEffect(() => {
    let disposed = false;

    const syncVersion = async () => {
      setState((current) => ({
        currentVersion,
        remoteVersion: current.remoteVersion,
        status: 'fetching',
      }));

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
          status: payload.version === currentVersion ? 'current' : 'outdated',
        });
      } catch {
        if (disposed) {
          return;
        }

        setState({
          currentVersion,
          remoteVersion: null,
          status: 'fetching',
        });
      }
    };

    void syncVersion();
    const interval = window.setInterval(() => {
      void syncVersion();
    }, VERSION_POLL_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [currentVersion]);

  return state;
}
