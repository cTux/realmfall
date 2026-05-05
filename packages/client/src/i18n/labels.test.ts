import { describe, expect, it, vi } from 'vitest';

vi.mock('./index', () => ({
  t: (key: string) =>
    ({
      'game.terrain.dungeon.brick': 'Brick Halls',
      'game.terrain.dungeon.mud': 'Mud Catacombs',
      'game.terrain.dungeon.obsidian': 'Obsidian Vault',
      'game.terrain.plains.description':
        'A clear stretch of wind-scraped shardland.',
      'game.terrain.plains.label': 'Plains',
    })[key] ?? key,
}));

describe('terrain label formatting', () => {
  it('uses theme-level labels for dungeon terrain variants', async () => {
    const { formatTerrainDescription, formatTerrainLabel } =
      await import('./labels');

    expect(formatTerrainLabel('dungeon-brick-floor')).toBe('Brick Halls');
    expect(formatTerrainDescription('dungeon-brick-wall')).toBe('Brick Halls');
    expect(formatTerrainLabel('dungeon-mud-puddle')).toBe('Mud Catacombs');
    expect(formatTerrainDescription('dungeon-obsidian-wall')).toBe(
      'Obsidian Vault',
    );
  });

  it('keeps surface terrain labels on the direct terrain keys', async () => {
    const { formatTerrainDescription, formatTerrainLabel } =
      await import('./labels');

    expect(formatTerrainLabel('plains')).toBe('Plains');
    expect(formatTerrainDescription('plains')).toBe(
      'A clear stretch of wind-scraped shardland.',
    );
  });
});
