import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { loadI18n } from './i18n';
import { store } from './app/store/store';
import './styles/base.scss';

void bootstrap();

async function bootstrap() {
  await loadI18n();
  const { App } = await import('./app/App');

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );
}
