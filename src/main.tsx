import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadI18n } from './i18n';
import { installGlobalVersion } from './version';
import './styles/base.scss';

installGlobalVersion();
void bootstrap();

async function bootstrap() {
  await loadI18n();
  const { App } = await import('./app/App');

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
