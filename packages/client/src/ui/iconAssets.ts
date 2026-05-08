import { resolveGeneratedIconAsset } from './generatedIconAssets';
import { resolveGameplayIconAsset } from './gameplayIconAssets';

export function resolveIconAsset(icon: string) {
  return (
    resolveGameplayIconAsset(icon) ??
    resolveGeneratedIconAsset(icon) ??
    icon
  );
}
