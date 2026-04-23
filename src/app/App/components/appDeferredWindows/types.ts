import type { ReactElement } from 'react';
import {
  WINDOW_COMPONENT_DEFERRED_KEYS,
  type AppDeferredWindowKey,
} from '../../../constants';
import type { AppWindowsActions } from '../../AppWindows.actionTypes';
import type { AppWindowsViewState } from '../../AppWindows.viewTypes';

export const APP_DEFERRED_WINDOW_KEYS = WINDOW_COMPONENT_DEFERRED_KEYS;

export interface DetailTooltipHandlers {
  onHoverDetail: AppWindowsActions['tooltip']['onShowTooltip'];
  onLeaveDetail: AppWindowsActions['tooltip']['onCloseTooltip'];
}

export interface AppDeferredWindowContext {
  appReady: boolean;
  combatPlayerParty: ReturnType<
    typeof import('../../hooks/useCombatPlayerParty').useCombatPlayerParty
  >;
  hexInfoView: ReturnType<typeof import('../../hooks/useHexInfoView').useHexInfoView>;
  mountedWindows: Pick<
    ReturnType<typeof import('../../hooks/useMountedWindows').useMountedWindows>,
    AppDeferredWindowKey
  >;
  managedWindowProps: ReturnType<
    typeof import('../../hooks/useManagedWindowProps').useManagedWindowProps
  >;
  recipeWindowStructure: ReturnType<
    typeof import('../../hooks/useRecipeWindowStructure').useRecipeWindowStructure
  >;
  views: Pick<
    AppWindowsViewState,
    'hero' | 'inventory' | 'hex' | 'recipes' | 'combat' | 'logs' | 'settings'
  >;
  actions: Pick<
    AppWindowsActions,
    'tooltip' | 'inventory' | 'hex' | 'recipes' | 'logs' | 'settings'
  >;
}

export interface AppDeferredWindowDetailContext extends AppDeferredWindowContext {
  detailTooltipHandlers: DetailTooltipHandlers;
}

export interface AppDeferredWindowEntry {
  key: AppDeferredWindowKey;
  element: ReactElement;
}

export interface AppDeferredWindowDescriptor {
  key: AppDeferredWindowKey;
  render: (context: AppDeferredWindowDetailContext) => ReactElement;
}
