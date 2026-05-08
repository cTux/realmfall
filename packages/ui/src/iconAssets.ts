import {
  GENERATED_ICON_ASSET_POOLS,
  resolveGeneratedIconAsset,
} from './generatedIconAssets';

export { GENERATED_ICON_ASSET_POOLS };

export function resolveIconAsset(icon: string) {
  return resolveGeneratedIconAsset(icon);
}
