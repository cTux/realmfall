export const APP_VERSION = __APP_VERSION__;

export function installGlobalVersion(
  globalObject: typeof globalThis = globalThis,
) {
  Object.defineProperty(globalObject, 'version', {
    configurable: true,
    enumerable: true,
    value: APP_VERSION,
    writable: false,
  });

  return APP_VERSION;
}
