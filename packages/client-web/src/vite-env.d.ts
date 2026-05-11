/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare global {
  var version: string;

  interface Window {
    version: string;
  }
}
