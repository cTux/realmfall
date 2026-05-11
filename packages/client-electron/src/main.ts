import process from 'node:process';
import { createMainProcessController } from './mainProcess.js';

await createMainProcessController().start({
  appMode:
    process.env.REALMFALL_ELECTRON_APP_MODE === 'development'
      ? 'development'
      : 'production',
  rendererDevUrl: process.env.REALMFALL_ELECTRON_RENDERER_URL,
});
