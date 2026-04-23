const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'];
const FONT_EXTENSIONS = ['woff', 'woff2', 'ttf', 'otf', 'eot'];

export const CHUNK_SIZE_WARNING_LIMIT_KB = 560;

function getVendorChunk(id: string) {
  const normalizedId = id.replace(/\\/g, '/');

  if (
    normalizedId.includes('/src/app/audioSettings.ts') ||
    normalizedId.includes('/src/app/settingsStorage.ts')
  ) {
    return 'audio-ui';
  }

  if (!normalizedId.includes('/node_modules/')) {
    return undefined;
  }

  if (normalizedId.includes('/node_modules/@rexa-developer/tiks/')) {
    return 'audio-ui';
  }

  if (
    normalizedId.includes('/node_modules/react-use-audio-player/') ||
    normalizedId.includes('/node_modules/howler/')
  ) {
    return 'background-audio';
  }

  if (
    normalizedId.includes('/node_modules/pixi.js/') ||
    normalizedId.includes('/node_modules/@pixi/')
  ) {
    return 'pixi';
  }

  if (
    normalizedId.includes('/node_modules/react/') ||
    normalizedId.includes('/node_modules/react/jsx-runtime') ||
    normalizedId.includes('/node_modules/react/jsx-dev-runtime')
  ) {
    return 'react-core';
  }

  if (
    normalizedId.includes('/node_modules/react-dom/') ||
    normalizedId.includes('/node_modules/scheduler/')
  ) {
    return 'react-dom-vendor';
  }

  return 'vendor';
}

function getAppChunk(id: string) {
  const normalizedId = id.replace(/\\/g, '/');

  if (
    normalizedId.includes('/src/game/state.ts') ||
    normalizedId.includes('/src/ui/rarity.ts')
  ) {
    return 'state';
  }

  return undefined;
}

export function getManualChunk(id: string) {
  return getVendorChunk(id) ?? getAppChunk(id);
}

export function getAssetFileName(assetInfo: { names: string[]; name?: string }) {
  const name = assetInfo.names[0] ?? assetInfo.name ?? '';
  const extension = name.split('.').pop()?.toLowerCase() ?? '';

  if (extension === 'css') {
    return 'assets/css/[name]-[hash][extname]';
  }

  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'assets/images/[name]-[hash][extname]';
  }

  if (extension === 'svg') {
    return 'assets/icons/[name]-[hash][extname]';
  }

  if (FONT_EXTENSIONS.includes(extension)) {
    return 'assets/fonts/[name]-[hash][extname]';
  }

  return 'assets/misc/[name]-[hash][extname]';
}
