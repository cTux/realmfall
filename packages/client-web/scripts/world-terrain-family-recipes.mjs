export const GENERATED_WORLD_TERRAIN_DIR =
  'packages/client-web/src/assets/images/terrain/generated';

export const SURFACE_TERRAIN_SOURCE_DIR =
  'packages/client-web/src/assets/images/terrain';

export const TERRAIN_FAMILY_RECIPES = {
  grassland: {
    palette: {
      accent: '#f7d794',
      foliage: '#c7f9cc',
      shadow: '#8d6e63',
    },
    variants: [
      {
        id: 'plains-bloom',
        file: 'plains-bloom.png',
        base: 'plains-v2.png',
        kind: 'surface',
        publishToAtlas: true,
        modulate: {
          brightness: 1.03,
          saturation: 0.97,
        },
        overlay: {
          motif: 'petals',
          accent: '#fde68a',
          bloom: '#f9a8d4',
          foliage: '#bbf7d0',
          wash: '#fef3c7',
        },
      },
      {
        id: 'steppe-soft',
        file: 'steppe-soft.png',
        base: 'steppe-v2.png',
        kind: 'surface',
        publishToAtlas: false,
        modulate: {
          brightness: 0.96,
          saturation: 0.84,
        },
        overlay: {
          motif: 'dry-grass',
          accent: '#f5deb3',
          foliage: '#d6d3b2',
          shadow: '#8b7355',
          wash: '#e9d5a1',
        },
      },
    ],
  },
  woodland: {
    palette: {
      accent: '#d9f99d',
      foliage: '#86efac',
      shadow: '#3f6212',
    },
    variants: [
      {
        id: 'forest-moss',
        file: 'forest-moss.png',
        base: 'forest-v2.png',
        kind: 'surface',
        publishToAtlas: true,
        modulate: {
          brightness: 0.97,
          saturation: 0.8,
        },
        overlay: {
          motif: 'moss',
          accent: '#bef264',
          foliage: '#6ee7b7',
          shadow: '#365314',
          wash: '#bbf7d0',
        },
      },
      {
        id: 'grove-fern',
        file: 'grove-fern.png',
        base: 'grove-v2.png',
        kind: 'surface',
        publishToAtlas: false,
        modulate: {
          brightness: 1.01,
          saturation: 0.9,
        },
        overlay: {
          motif: 'fern',
          accent: '#dcfce7',
          foliage: '#4ade80',
          shadow: '#166534',
          wash: '#86efac',
        },
      },
    ],
  },
  alpine: {
    palette: {
      accent: '#e2e8f0',
      foliage: '#cbd5e1',
      shadow: '#334155',
    },
    variants: [
      {
        id: 'mountain-ridge',
        file: 'mountain-ridge.png',
        base: 'mountain-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.88,
          saturation: 0.68,
        },
        overlay: {
          terrain: 'mountain',
          shape: 'straight',
          accent: '#e2e8f0',
          fill: '#64748b',
          shadow: '#1e293b',
        },
      },
      {
        id: 'mountain-straight',
        file: 'mountain-straight.png',
        base: 'mountain-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.88,
          saturation: 0.68,
        },
        overlay: {
          terrain: 'mountain',
          shape: 'straight',
          accent: '#e2e8f0',
          fill: '#64748b',
          shadow: '#1e293b',
        },
      },
      {
        id: 'mountain-bend',
        file: 'mountain-bend.png',
        base: 'mountain-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.86,
          saturation: 0.64,
        },
        overlay: {
          terrain: 'mountain',
          shape: 'bend',
          accent: '#e2e8f0',
          fill: '#64748b',
          shadow: '#1e293b',
        },
      },
      {
        id: 'mountain-fork',
        file: 'mountain-fork.png',
        base: 'mountain-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.84,
          saturation: 0.64,
        },
        overlay: {
          terrain: 'mountain',
          shape: 'fork',
          accent: '#e2e8f0',
          fill: '#64748b',
          shadow: '#1e293b',
        },
      },
      {
        id: 'mountain-end',
        file: 'mountain-end.png',
        base: 'mountain-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.89,
          saturation: 0.66,
        },
        overlay: {
          terrain: 'mountain',
          shape: 'end',
          accent: '#e2e8f0',
          fill: '#64748b',
          shadow: '#1e293b',
        },
      },
      {
        id: 'mountain-isolated',
        file: 'mountain-isolated.png',
        base: 'mountain-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.9,
          saturation: 0.7,
        },
        overlay: {
          terrain: 'mountain',
          shape: 'isolated',
          accent: '#f8fafc',
          fill: '#64748b',
          shadow: '#1e293b',
        },
      },
      {
        id: 'mountain-massif',
        file: 'mountain-massif.png',
        base: 'mountain-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.82,
          saturation: 0.62,
        },
        overlay: {
          terrain: 'mountain',
          shape: 'massif',
          accent: '#f1f5f9',
          fill: '#475569',
          shadow: '#0f172a',
        },
      },
    ],
  },
  corrupted: {
    palette: {
      accent: '#fb7185',
      foliage: '#f97316',
      shadow: '#1f1720',
    },
    variants: [
      {
        id: 'rift-straight',
        file: 'rift-straight.png',
        base: 'rift-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.84,
          saturation: 0.82,
        },
        overlay: {
          terrain: 'rift',
          shape: 'straight',
          accent: '#fb7185',
          fill: '#3f1d2e',
          shadow: '#190d16',
        },
      },
      {
        id: 'rift-bend',
        file: 'rift-bend.png',
        base: 'rift-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.83,
          saturation: 0.84,
        },
        overlay: {
          terrain: 'rift',
          shape: 'bend',
          accent: '#f97316',
          fill: '#3f1d2e',
          shadow: '#190d16',
        },
      },
      {
        id: 'rift-fork',
        file: 'rift-fork.png',
        base: 'rift-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.81,
          saturation: 0.88,
        },
        overlay: {
          terrain: 'rift',
          shape: 'fork',
          accent: '#fb7185',
          fill: '#33121f',
          shadow: '#12060d',
        },
      },
      {
        id: 'rift-end',
        file: 'rift-end.png',
        base: 'rift-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.85,
          saturation: 0.8,
        },
        overlay: {
          terrain: 'rift',
          shape: 'end',
          accent: '#f97316',
          fill: '#3f1d2e',
          shadow: '#190d16',
        },
      },
      {
        id: 'rift-isolated',
        file: 'rift-isolated.png',
        base: 'rift-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.86,
          saturation: 0.78,
        },
        overlay: {
          terrain: 'rift',
          shape: 'isolated',
          accent: '#fdba74',
          fill: '#472032',
          shadow: '#190d16',
        },
      },
      {
        id: 'rift-massif',
        file: 'rift-massif.png',
        base: 'rift-v2.png',
        kind: 'blocker',
        publishToAtlas: true,
        modulate: {
          brightness: 0.78,
          saturation: 0.9,
        },
        overlay: {
          terrain: 'rift',
          shape: 'massif',
          accent: '#f43f5e',
          fill: '#2a0d18',
          shadow: '#0f0610',
        },
      },
    ],
  },
};

export const GENERATED_SURFACE_TERRAIN_SOURCES = Object.entries(
  TERRAIN_FAMILY_RECIPES,
).flatMap(([family, recipe]) =>
  recipe.variants
    .filter(({ kind }) => kind === 'surface')
    .map((variant) => ({
      family,
      file: variant.file,
      id: variant.id,
      source: `${GENERATED_WORLD_TERRAIN_DIR}/${variant.file}`,
      ...variant,
    })),
);

export const SHIPPED_GENERATED_SURFACE_TERRAIN_SOURCES =
  GENERATED_SURFACE_TERRAIN_SOURCES.filter(
    ({ publishToAtlas }) => publishToAtlas,
  );

export const SHIPPED_GENERATED_PASSABLE_TERRAIN_SOURCES =
  SHIPPED_GENERATED_SURFACE_TERRAIN_SOURCES.filter(
    ({ kind }) => kind === 'surface',
  );
