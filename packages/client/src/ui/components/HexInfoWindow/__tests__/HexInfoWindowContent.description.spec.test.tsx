import { HexInfoWindowContentTestkit } from './HexInfoWindowContentTestkit';

describe('HexInfoWindowContent description', () => {
  let testkit: HexInfoWindowContentTestkit;

  beforeEach(() => {
    testkit = new HexInfoWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('shows the hex description when no content is present', async () => {
    await testkit.actions.mount({
      terrain: 'Plains',
      structure: null,
      hexDescription: 'A clear stretch of wind-scraped shardland.',
      enemyCount: 0,
      interactLabel: null,
      canInteract: false,
      canTerritoryAction: false,
      territoryActionKind: 'claim',
      territoryActionLabel: 'Cl(a)im',
      canHealTerritoryNpc: false,
      canBulkProspectEquipment: false,
      canBulkSellEquipment: false,
    });

    await testkit.expect.descriptionVisible(
      'A clear stretch of wind-scraped shardland.',
    );
  });
});
