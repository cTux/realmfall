import type {
  AppDeferredWindowContext,
  AppDeferredWindowDescriptor,
  AppDeferredWindowEntry,
} from './appDeferredWindows/types';
import {
  APP_DEFERRED_WINDOW_KEYS,
} from './appDeferredWindows/types';
import { equipmentDeferredWindow } from './appDeferredWindows/equipmentDeferredWindow';
import { hexInfoDeferredWindow } from './appDeferredWindows/hexInfoDeferredWindow';
import { inventoryDeferredWindow } from './appDeferredWindows/inventoryDeferredWindow';
import { logDeferredWindow } from './appDeferredWindows/logDeferredWindow';
import { recipesDeferredWindow } from './appDeferredWindows/recipesDeferredWindow';
import { settingsDeferredWindow } from './appDeferredWindows/settingsDeferredWindow';
import { skillsDeferredWindow } from './appDeferredWindows/skillsDeferredWindow';

export type { AppDeferredWindowContext as AppDeferredWindowsProps } from './appDeferredWindows/types';

const APP_DEFERRED_WINDOW_DESCRIPTORS = [
  skillsDeferredWindow,
  recipesDeferredWindow,
  hexInfoDeferredWindow,
  equipmentDeferredWindow,
  inventoryDeferredWindow,
  logDeferredWindow,
  settingsDeferredWindow,
] as const satisfies readonly AppDeferredWindowDescriptor[];

const APP_DEFERRED_WINDOW_DESCRIPTOR_BY_KEY = Object.fromEntries(
  APP_DEFERRED_WINDOW_DESCRIPTORS.map((descriptor) => [descriptor.key, descriptor]),
) as Record<(typeof APP_DEFERRED_WINDOW_DESCRIPTORS)[number]['key'], AppDeferredWindowDescriptor>;

export function getMountedDeferredWindowKeys(
  mountedWindows: AppDeferredWindowContext['mountedWindows'],
) {
  return APP_DEFERRED_WINDOW_KEYS.filter((key) => mountedWindows[key]);
}

export function getAppDeferredWindowEntries(
  context: AppDeferredWindowContext,
): AppDeferredWindowEntry[] {
  const detailTooltipHandlers = {
    onHoverDetail: context.actions.tooltip.onShowTooltip,
    onLeaveDetail: context.actions.tooltip.onCloseTooltip,
  };

  return getMountedDeferredWindowKeys(context.mountedWindows).map((key) => ({
    key,
    element: APP_DEFERRED_WINDOW_DESCRIPTOR_BY_KEY[key].render({
      ...context,
      detailTooltipHandlers,
    }),
  }));
}
