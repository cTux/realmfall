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
      style={{
        alignItems: 'center',
        background:
          'radial-gradient(circle at top, #1f2a44 0%, #0b1020 55%, #050814 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        inset: 0,
        justifyContent: 'center',
        position: 'fixed',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          animation: 'realmfall-bootstrap-pulse 1.1s ease-in-out infinite alternate',
          background:
            'linear-gradient(135deg, rgba(96, 165, 250, 0.95), rgba(34, 211, 238, 0.75))',
          borderRadius: '999px',
          boxShadow: '0 0 32px rgba(34, 211, 238, 0.35)',
          height: '0.9rem',
          width: '0.9rem',
        }}
      />
      <div
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Loading Realmfall
      </div>
      <style>{`
        @keyframes realmfall-bootstrap-pulse {
          from {
            opacity: 0.55;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1.08);
          }
        }
      `}</style>
    </div>
  );
}
