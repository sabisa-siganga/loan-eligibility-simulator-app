import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/600.css';
import '@fontsource/nunito-sans/700.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import { store } from './store';
import './styles/global.scss';

const rootElement = document.getElementById('root');

/** Fail fast if the host HTML is missing the mount node. */
if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

/**
 * Start Mock Service Worker before React mounts so the first catalog/eligibility fetches are
 * intercepted. Skipped under Vitest (node Mock Service Worker server covers that path).
 */
const enableMocking = async (): Promise<void> => {
  /**
   * Vitest uses the node Mock Service Worker server instead; skip the browser worker there.
   */
  if (import.meta.env.MODE === 'test') {
    return;
  }

  /**
   * Load and start the browser worker; bypass unhandled requests so Vite assets
   * are not treated as missing loan endpoints.
   */
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  });
};

/** After mocks are ready, mount the app with Redux and StrictMode. */
void enableMocking().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  );
});
