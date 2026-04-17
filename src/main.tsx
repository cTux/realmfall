import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadI18n } from './i18n';
import { installGlobalVersion } from './version';
import './styles/base.scss';

installGlobalVersion();
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

void bootstrap();

async function bootstrap() {
  try {
    await loadI18n();
    const { App } = await import('./app/App');

    root.render(
      <React.StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </React.StrictMode>,
    );
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
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      role="status"
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at top, #1f2a44 0%, #0b1020 55%, #050814 100%)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        position: 'fixed',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          animation: 'realmfall-bootstrap-spin 0.8s linear infinite',
          border: '0.22rem solid rgba(148, 163, 184, 0.2)',
          borderTopColor: 'rgba(96, 165, 250, 0.95)',
          borderRadius: '999px',
          boxShadow: '0 0 32px rgba(34, 211, 238, 0.18)',
          height: '2rem',
          width: '2rem',
        }}
      />
      <style>{`
        @keyframes realmfall-bootstrap-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
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

function BootstrapErrorScreen() {
  return (
    <div
      aria-live="assertive"
      role="alert"
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at top, #2f1725 0%, #1f1220 55%, #0b0911 100%)',
        color: '#f8fafc',
        display: 'flex',
        fontFamily:
          '"Segoe UI", "Trebuchet MS", "Gill Sans", "Century Gothic", sans-serif',
        inset: 0,
        justifyContent: 'center',
        padding: '2rem',
        position: 'fixed',
        textAlign: 'center',
      }}
    >
      <div>
        <strong style={{ display: 'block', fontSize: '1.1rem' }}>
          Realmfall failed to load.
        </strong>
        <span style={{ color: 'rgba(226, 232, 240, 0.82)' }}>
          Reload the page to retry.
        </span>
      </div>
    </div>
  );
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
