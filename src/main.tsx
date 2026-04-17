import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadI18n } from './i18n';
import { installGlobalVersion } from './version';
import './styles/base.scss';

installGlobalVersion();
const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BootstrapShell />
  </React.StrictMode>,
);

void bootstrap();

async function bootstrap() {
  const [{ App }] = await Promise.all([import('./app/App'), loadI18n()]);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
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
