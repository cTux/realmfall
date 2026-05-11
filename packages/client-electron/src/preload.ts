import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('realmfallDesktop', Object.freeze({}));
