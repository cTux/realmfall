import React from 'react';
import ReactDOM from 'react-dom/client';
import { CLIENT_BOOTSTRAP_SHELL } from './client.config';
import {
  applyInterfaceFontFamily,
  loadInterfaceFontFamily,
} from './app/interfaceFonts';
import { loadInterfaceSettings } from './app/interfaceSettings';
import { loadI18n } from './i18n/bootstrap';
import { BOOTSTRAP_SCREEN_COLORS } from './theme.config';
import { BootstrapErrorScreen } from './ui/components/BootstrapErrorScreen';
import { installGlobalVersion } from './version';
import './styles/base.scss';

type PerformanceHarnessModule =
  typeof import('./performance/performanceHarness');

const performanceHarnessModulePromise = loadPerformanceHarness();

installGlobalVersion();
recordPerformanceStartupMark('main-start');
document.addEventListener('contextmenu', preventNativeContextMenu);
const bootstrapInterfaceSettings = loadInterfaceSettings();
applyInterfaceFontFamily(bootstrapInterfaceSettings.fontFamily);

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement, {
  onCaughtError: reportRootError,
  onUncaughtError: reportRootError,
});

root.render(
  <React.StrictMode>
    <BootstrapShell />
  </React.StrictMode>,
);
recordPerformanceStartupMark('bootstrap-shell-rendered');

void bootstrap();

async function bootstrap() {
  try {
    const appModulePromise = import('./app/App').then((module) => {
      recordPerformanceStartupMark('app-module-loaded');
      return module;
    });
    const i18nPromise = loadI18n(bootstrapInterfaceSettings.language).then(
      () => {
        recordPerformanceStartupMark('i18n-loaded');
      },
    );
    const fontPromise = loadInterfaceFontFamily(
      bootstrapInterfaceSettings.fontFamily,
    );

    const [{ App }] = await Promise.all([
      appModulePromise,
      i18nPromise,
      fontPromise,
    ]);

    root.render(
      <React.StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </React.StrictMode>,
    );
    recordPerformanceStartupMark('app-render-scheduled');
  } catch (error) {
    reportRootError(error);
    root.render(
      <React.StrictMode>
        <BootstrapErrorScreen />
      </React.StrictMode>,
    );
  }
}

function BootstrapShell() {
  const spinnerStyle: React.CSSProperties = {
    animation: `${CLIENT_BOOTSTRAP_SHELL.spinnerAnimationSeconds}s linear infinite spin`,
    border: `${CLIENT_BOOTSTRAP_SHELL.spinnerBorderWidthPx}px solid ${BOOTSTRAP_SCREEN_COLORS.spinnerTrack}`,
    borderTop: `${CLIENT_BOOTSTRAP_SHELL.spinnerBorderWidthPx}px solid ${BOOTSTRAP_SCREEN_COLORS.spinnerActive}`,
    borderRadius: `${CLIENT_BOOTSTRAP_SHELL.spinnerBorderRadiusPx}px`,
    height: `${CLIENT_BOOTSTRAP_SHELL.spinnerSizeRem}rem`,
    width: `${CLIENT_BOOTSTRAP_SHELL.spinnerSizeRem}rem`,
  };

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      role="status"
      style={{
        alignItems: 'center',
        background: BOOTSTRAP_SCREEN_COLORS.background,
        display: 'flex',
        fontFamily: 'var(--app-font-family)',
        inset: 0,
        justifyContent: 'center',
        position: 'fixed',
      }}
    >
      <div aria-hidden="true" style={spinnerStyle} />
    </div>
  );
}

type RootErrorBoundaryProps = {
  children: React.ReactNode;
};

type RootErrorBoundaryState = {
  hasError: boolean;
};

class RootErrorBoundary extends React.Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  override state: RootErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    reportRootError(error);
  }

  override render() {
    if (this.state.hasError) {
      return <BootstrapErrorScreen />;
    }

    return this.props.children;
  }
}

function loadPerformanceHarness(): Promise<PerformanceHarnessModule | null> | null {
  if (!isPerformanceHarnessRequested()) {
    return null;
  }

  return import('./performance/performanceHarness')
    .then((module) => {
      module.installPerformanceHarness({ force: true });
      return module;
    })
    .catch((error) => {
      reportRootError(error);
      return null;
    });
}

function recordPerformanceStartupMark(name: string) {
  const startTime = getPerformanceStartTime();
  void performanceHarnessModulePromise?.then((module) => {
    module?.recordStartupMark(name, startTime);
  });
}

function isPerformanceHarnessRequested() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('perf') === '1' || params.get('realmfallPerf') === '1') {
    return true;
  }

  try {
    return window.localStorage.getItem('realmfall:perf') === '1';
  } catch {
    return false;
  }
}

function getPerformanceStartTime() {
  return window.performance?.now() ?? Date.now();
}

function reportRootError(error: unknown) {
  if ('reportError' in window && typeof window.reportError === 'function') {
    window.reportError(
      error instanceof Error ? error : new Error(String(error)),
    );
    return;
  }

  console.error(error);
}

function preventNativeContextMenu(event: Event) {
  event.preventDefault();
}
