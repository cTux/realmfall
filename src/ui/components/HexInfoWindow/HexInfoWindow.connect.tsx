import { useCallback } from 'react';
import { formatTerrainLabel } from '../../../app/App/appHelpers';
import { gameActions } from '../../../app/store/gameSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectCanProspect,
  selectCanSell,
  selectClaimStatus,
  selectCurrentTile,
  selectGame,
  selectGameWorldTimeMs,
  selectGold,
  selectInteractLabel,
  selectProspectExplanation,
  selectSellExplanation,
  selectTownStock,
} from '../../../app/store/selectors/gameSelectors';
import {
  selectWindowShown,
  selectWindows,
} from '../../../app/store/selectors/uiSelectors';
import { uiActions } from '../../../app/store/uiSlice';
import {
  describeStructure,
  getHostileEnemyIds,
  type GameState,
} from '../../../game/state';
import { HexInfoWindow } from './HexInfoWindow';
import type { HexInfoWindowProps } from './types';

export interface HexInfoWindowConnectedProps {
  combatSnapshot: {
    combat: NonNullable<GameState['combat']>;
    enemies: ReturnType<typeof import('../../../game/state').getEnemiesAt>;
  } | null;
  onHoverItem: HexInfoWindowProps['onHoverItem'];
  onLeaveItem: HexInfoWindowProps['onLeaveItem'];
  onHoverDetail?: HexInfoWindowProps['onHoverDetail'];
  onLeaveDetail?: HexInfoWindowProps['onLeaveDetail'];
}

export function HexInfoWindowConnected({
  combatSnapshot,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: HexInfoWindowConnectedProps) {
  const dispatch = useAppDispatch();
  const game = useAppSelector(selectGame);
  const currentTile = useAppSelector(selectCurrentTile);
  const claimStatus = useAppSelector(selectClaimStatus);
  const canProspect = useAppSelector(selectCanProspect);
  const canSell = useAppSelector(selectCanSell);
  const interactLabel = useAppSelector(selectInteractLabel);
  const prospectExplanation = useAppSelector(selectProspectExplanation);
  const sellExplanation = useAppSelector(selectSellExplanation);
  const townStock = useAppSelector(selectTownStock);
  const gold = useAppSelector(selectGold);
  const windows = useAppSelector(selectWindows);
  const windowShown = useAppSelector(selectWindowShown);
  const worldTimeMs = useAppSelector(selectGameWorldTimeMs);

  const handleMove = useCallback(
    (position: HexInfoWindowProps['position']) => {
      dispatch(uiActions.moveWindow({ key: 'hexInfo', position }));
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(uiActions.setWindowVisibility({ key: 'hexInfo', shown: false }));
  }, [dispatch]);

  const handleSetHome = useCallback(() => {
    dispatch(gameActions.setHomeHex());
  }, [dispatch]);

  const handleInteract = useCallback(() => {
    dispatch(gameActions.interactWithStructureAtTime({ worldTimeMs }));
  }, [dispatch, worldTimeMs]);

  const handleProspect = useCallback(() => {
    dispatch(gameActions.prospectInventoryAtTime({ worldTimeMs }));
  }, [dispatch, worldTimeMs]);

  const handleSellAll = useCallback(() => {
    dispatch(gameActions.sellAllItemsAtTime({ worldTimeMs }));
  }, [dispatch, worldTimeMs]);

  const handleClaim = useCallback(() => {
    dispatch(gameActions.claimCurrentHexAtTime({ worldTimeMs }));
  }, [dispatch, worldTimeMs]);

  const handleBuyItem = useCallback(
    (itemId: string) => {
      dispatch(gameActions.buyTownItemAtTime({ itemId, worldTimeMs }));
    },
    [dispatch, worldTimeMs],
  );

  return (
    <HexInfoWindow
      position={windows.hexInfo}
      onMove={handleMove}
      visible={windowShown.hexInfo}
      onClose={handleClose}
      isHome={
        game.homeHex.q === game.player.coord.q &&
        game.homeHex.r === game.player.coord.r
      }
      canSetHome={
        !currentTile.claim || currentTile.claim.ownerType === 'player'
      }
      onSetHome={handleSetHome}
      terrain={formatTerrainLabel(currentTile.terrain)}
      structure={
        currentTile.structure ? describeStructure(currentTile.structure) : null
      }
      enemyCount={
        game.combat
          ? (combatSnapshot?.enemies.length ?? 0)
          : getHostileEnemyIds(game, currentTile.coord).length
      }
      interactLabel={interactLabel}
      canInteract={Boolean(interactLabel)}
      canProspect={canProspect}
      canSell={canSell}
      canClaim={claimStatus.canClaim}
      claimExplanation={claimStatus.reason}
      prospectExplanation={prospectExplanation}
      sellExplanation={sellExplanation}
      onInteract={handleInteract}
      onProspect={handleProspect}
      onSellAll={handleSellAll}
      onClaim={handleClaim}
      structureHp={currentTile.structureHp}
      structureMaxHp={currentTile.structureMaxHp}
      territoryName={currentTile.claim?.ownerName ?? null}
      territoryOwnerType={currentTile.claim?.ownerType ?? null}
      territoryNpc={currentTile.claim?.npc ?? null}
      townStock={townStock}
      gold={gold}
      onBuyItem={handleBuyItem}
      onHoverItem={onHoverItem}
      onLeaveItem={onLeaveItem}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    />
  );
}
