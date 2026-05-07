import { buildItemFromConfig } from '../../../../game/content/items';
import { ItemId } from '../../../../game/content/ids';
import { HexInfoWindowContentTestkit } from './HexInfoWindowContentTestkit';

describe('HexInfoWindowContent actions', () => {
  let testkit: HexInfoWindowContentTestkit;

  beforeEach(() => {
    testkit = new HexInfoWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('renders explicit enter and leave dungeon buttons in the content actions', async () => {
    await testkit.actions.mount({
      terrain: 'Rift',
      structure: 'Dungeon',
      hexDescription:
        'A rift-torn ruin that marks the entrance to a dungeon below.',
      enemyCount: 2,
      interactLabel: 'Enter dungeon',
      canInteract: true,
      canTerritoryAction: false,
      territoryActionLabel: 'Cl(a)im',
      canHealTerritoryNpc: false,
      canBulkProspectEquipment: false,
      canBulkSellEquipment: false,
    });

    await testkit.expect.actionButtonVisible('Enter dungeon');
    await testkit.actions.clickAction('Enter dungeon');
    await testkit.expect.interactActionTriggered();

    await testkit.restore();

    await testkit.actions.mount({
      terrain: 'Dungeon',
      structure: 'Dungeon',
      hexDescription:
        'A rift-torn ruin that marks the entrance to a dungeon below.',
      enemyCount: 0,
      interactLabel: 'Leave dungeon',
      canInteract: true,
      canTerritoryAction: false,
      territoryActionLabel: 'Cl(a)im',
      canHealTerritoryNpc: false,
      canBulkProspectEquipment: false,
      canBulkSellEquipment: false,
    });

    await testkit.expect.actionButtonVisible('Leave dungeon');
    await testkit.actions.clickAction('Leave dungeon');
    await testkit.expect.interactActionTriggered(2);
  });

  it('shrinks content-window item slots to 0.8x of their shared sizes', async () => {
    const townItem = buildItemFromConfig(ItemId.TownKnife, {
      id: 'town-knife',
    });
    const lootItem = buildItemFromConfig(ItemId.Gold, {
      id: 'loot-gold',
      quantity: 3,
    });

    await testkit.actions.mount({
      terrain: 'Plains',
      structure: 'Town',
      hexDescription:
        'A shardside refuge where survivors trade, resupply, and catch their breath.',
      enemyCount: 0,
      interactLabel: null,
      canInteract: false,
      canTerritoryAction: false,
      territoryActionLabel: 'Cl(a)im',
      canHealTerritoryNpc: false,
      canBulkProspectEquipment: false,
      canBulkSellEquipment: false,
      territoryNpc: null,
      townStock: [{ item: townItem, price: 12 }],
      gold: 20,
      loot: [lootItem],
    });

    await testkit.expect.compactAndWideSlotsRendered();
  });
});
