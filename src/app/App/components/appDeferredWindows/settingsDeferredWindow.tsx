import { createLazyWindowComponent } from '../../../../ui/components/lazyWindowComponent';
import { loadNamedWindowModule } from './lazyDeferredWindowModule';
import type { AppDeferredWindowDescriptor } from './types';

const GameSettingsWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../../ui/components/GameSettingsWindow'))['GameSettingsWindow']
  >[0]
>(
  loadNamedWindowModule(() =>
    import('../../../../ui/components/GameSettingsWindow').then(
      (module) => module.GameSettingsWindow,
    ),
  ),
);

export const settingsDeferredWindow: AppDeferredWindowDescriptor = {
  key: 'settings',
  render: ({ actions, managedWindowProps, views }) => (
    <GameSettingsWindow
      {...managedWindowProps.settings}
      audioSettings={views.settings.audio}
      graphicsSettings={views.settings.graphics}
      onSave={actions.settings.onSaveSettings}
      onSaveAndReload={actions.settings.onSaveSettingsAndReload}
      onResetSaveArea={actions.settings.onResetSaveArea}
    />
  ),
};
