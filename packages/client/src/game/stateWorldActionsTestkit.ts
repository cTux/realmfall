import {
  addBannerMaterials,
  addResourceItems,
} from './stateWorldActionsTestHelpers';

export class StateWorldActionsTestkit {
  readonly actions = {
    addBannerMaterials: (...args: Parameters<typeof addBannerMaterials>) =>
      addBannerMaterials(...args),
    addResourceItems: (...args: Parameters<typeof addResourceItems>) =>
      addResourceItems(...args),
  };
}
