import { useAppSelector } from '../store/hooks';
import {
  selectCanProspect,
  selectCanSell,
  selectClaimStatus,
  selectCombatEnemies,
  selectCurrentTile,
  selectGold,
  selectInteractLabel,
  selectInventoryCounts,
  selectPlayerStats,
  selectProspectExplanation,
  selectRecipeBookKnown,
  selectRecipes,
  selectSellExplanation,
  selectTownStock,
} from '../store/selectors/gameSelectors';
import { selectFilteredLogs } from '../store/selectors/uiSelectors';

export function useAppGameView() {
  const claimStatus = useAppSelector(selectClaimStatus);
  const canProspect = useAppSelector(selectCanProspect);
  const canSell = useAppSelector(selectCanSell);
  const combatEnemies = useAppSelector(selectCombatEnemies);
  const currentTile = useAppSelector(selectCurrentTile);
  const filteredLogs = useAppSelector(selectFilteredLogs);
  const gold = useAppSelector(selectGold);
  const interactLabel = useAppSelector(selectInteractLabel);
  const inventoryCounts = useAppSelector(selectInventoryCounts);
  const prospectExplanation = useAppSelector(selectProspectExplanation);
  const recipeBookKnown = useAppSelector(selectRecipeBookKnown);
  const recipes = useAppSelector(selectRecipes);
  const sellExplanation = useAppSelector(selectSellExplanation);
  const stats = useAppSelector(selectPlayerStats);
  const townStock = useAppSelector(selectTownStock);

  return {
    claimStatus,
    canProspect,
    canSell,
    combatEnemies,
    currentTile,
    filteredLogs,
    gold,
    interactLabel,
    inventoryCounts,
    prospectExplanation,
    recipeBookKnown,
    recipes,
    sellExplanation,
    stats,
    townStock,
  };
}
