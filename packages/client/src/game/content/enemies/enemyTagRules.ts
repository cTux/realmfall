import { GAME_TAGS, uniqueTags, type GameTag } from '../tags';

export function buildEnemyTags({
  animal,
  worldBoss,
  tags,
}: {
  animal?: boolean;
  worldBoss?: boolean;
  tags?: readonly GameTag[];
}) {
  return uniqueTags(
    GAME_TAGS.enemy.hostile,
    animal ? GAME_TAGS.enemy.animal : undefined,
    worldBoss ? GAME_TAGS.enemy.worldBoss : undefined,
    ...(tags ?? []),
  );
}
