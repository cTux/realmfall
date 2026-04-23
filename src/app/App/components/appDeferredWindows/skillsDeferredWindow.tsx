import { createLazyWindowComponent } from '../../../../ui/components/lazyWindowComponent';
import { loadNamedWindowModule } from './lazyDeferredWindowModule';
import type { AppDeferredWindowDescriptor } from './types';

const SkillsWindow = createLazyWindowComponent<
  Parameters<(typeof import('../../../../ui/components/SkillsWindow'))['SkillsWindow']>[0]
>(
  loadNamedWindowModule(() =>
    import('../../../../ui/components/SkillsWindow').then(
      (module) => module.SkillsWindow,
    ),
  ),
);

export const skillsDeferredWindow: AppDeferredWindowDescriptor = {
  key: 'skills',
  render: ({ detailTooltipHandlers, managedWindowProps, views }) => (
    <SkillsWindow
      {...managedWindowProps.skills}
      skills={views.hero.overview.skills}
      {...detailTooltipHandlers}
    />
  ),
};
