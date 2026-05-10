import { Button } from '@realmfall/ui-react';
import { ENEMY_CONFIGS } from '@realmfall/core/game/content/enemies';
import {
  ITEM_CONFIGS,
  getItemConfigCategory,
  isEquippableItemCategory,
} from '@realmfall/core/game/content/items';
import type { DebugEquipmentType } from '@realmfall/core/game/stateDebugWindow';
import { DEBUG_EQUIPMENT_TYPES } from '@realmfall/core/game/stateDebugWindow';
import { RARITY_ORDER } from '@realmfall/core/game/stateTypes';
import { t } from '../../../i18n';
import type { DebugWindowContentProps } from './types';
import styles from './styles.module.scss';

const DEBUG_DROP_ITEM_CONFIGS = ITEM_CONFIGS.filter(
  (config) => !isEquippableItemCategory(getItemConfigCategory(config)),
);

const DEBUG_DROP_ITEM_GROUPS = [
  {
    key: 'consumable',
    items: DEBUG_DROP_ITEM_CONFIGS.filter(
      (config) => getItemConfigCategory(config) === 'consumable',
    ),
  },
  {
    key: 'resource',
    items: DEBUG_DROP_ITEM_CONFIGS.filter(
      (config) => getItemConfigCategory(config) === 'resource',
    ),
  },
] as const;

const DEBUG_ENEMY_CONFIGS = ENEMY_CONFIGS.filter((config) => !config.worldBoss);

const DEBUG_EQUIPMENT_TYPE_LABELS: Record<DebugEquipmentType, string> = {
  weapon: 'weapon',
  offhand: 'offhand',
  armor: 'armor',
  artifact: 'artifact',
};

const DEBUG_DROP_GROUP_LABELS = {
  consumable: 'Consumables',
  resource: 'Resources',
} as const;

export function DebugWindowContent({
  onCreateEquipmentItem,
  onCreateDropItem,
  onSpawnEnemyNearby,
  onTriggerBloodMoon,
  onTriggerHarvestMoon,
  onTriggerEarthquake,
  onSetMorning,
  onSetNight,
}: DebugWindowContentProps) {
  return (
    <div className={styles.layout}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Equipment</h2>
          <p className={styles.sectionDescription}>
            Add generated gear directly to your inventory.
          </p>
        </div>
        <div className={styles.buttonGrid}>
          {RARITY_ORDER.flatMap((rarity) =>
            DEBUG_EQUIPMENT_TYPES.map((type) => (
              <Button
                unstyled
                key={`${rarity}-${type}`}
                type="button"
                className={styles.button}
                onClick={() => onCreateEquipmentItem(type, rarity)}
              >
                {`Create ${t(`ui.rarity.${rarity}`)} ${DEBUG_EQUIPMENT_TYPE_LABELS[type]}`}
              </Button>
            )),
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Drops</h2>
          <p className={styles.sectionDescription}>
            Create any stackable consumable or resource drop.
          </p>
        </div>
        <div className={styles.groupStack}>
          {DEBUG_DROP_ITEM_GROUPS.map((group) => (
            <div key={group.key} className={styles.group}>
              <h3 className={styles.groupTitle}>
                {DEBUG_DROP_GROUP_LABELS[group.key]}
              </h3>
              <div className={styles.buttonGrid}>
                {group.items.map((config) => (
                  <Button
                    unstyled
                    key={config.key}
                    type="button"
                    className={styles.button}
                    onClick={() => onCreateDropItem(config.key)}
                  >
                    {config.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Enemies</h2>
          <p className={styles.sectionDescription}>
            Spawn non-boss enemies of any rarity on a nearby valid hex.
          </p>
        </div>
        <div className={styles.groupStack}>
          {DEBUG_ENEMY_CONFIGS.map((config) => (
            <div key={config.id} className={styles.group}>
              <h3 className={styles.groupTitle}>{config.name}</h3>
              <div className={styles.buttonGrid}>
                {RARITY_ORDER.map((rarity) => (
                  <Button
                    unstyled
                    key={`${config.id}-${rarity}`}
                    type="button"
                    className={styles.button}
                    onClick={() => onSpawnEnemyNearby(config.id, rarity)}
                  >
                    {`Spawn ${t(`ui.rarity.${rarity}`)} ${config.name}`}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>World events</h2>
          <p className={styles.sectionDescription}>
            Force major world events without waiting on the world clock.
          </p>
        </div>
        <div className={styles.buttonGrid}>
          <ActionButton onClick={onTriggerBloodMoon}>Bloodmoon</ActionButton>
          <ActionButton onClick={onTriggerHarvestMoon}>
            Harvestmoon
          </ActionButton>
          <ActionButton onClick={onTriggerEarthquake}>Earthquake</ActionButton>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Time of day</h2>
          <p className={styles.sectionDescription}>
            Jump to the next morning or force night now.
          </p>
        </div>
        <div className={styles.buttonGrid}>
          <ActionButton onClick={onSetMorning}>Morning (next day)</ActionButton>
          <ActionButton onClick={onSetNight}>Night</ActionButton>
        </div>
      </section>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <Button
      unstyled
      type="button"
      className={`${styles.button} ${styles.actionButton}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
