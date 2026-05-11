import { Button } from '@realmfall/ui-react/button';
import { ItemSlot as ItemSlotButton } from '@realmfall/ui-react/item-slot';
import roundStarIcon from '../../../assets/icons/round-star.svg';
import { t } from '../../../i18n';
import { ICON_TINT_COLORS } from '../../../theme.config';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';
import styles from './styles.module.scss';
import type { RecipeBookRow } from './useRecipeBookRows';
import { getRecipeCraftCount } from './recipeBookAction';
import type { CSSProperties } from 'react';

export interface RecipeBookVirtualRowProps {
  recipeRow: RecipeBookRow;
  index: number;
  top: number;
  measureRef: (node: HTMLElement | null) => void;
  onCraft: (recipeId: string, count?: number | 'max') => void;
  onToggleFavoriteRecipe: (recipeId: string) => void;
  onHoverDetail?: WindowDetailTooltipHandlers['onHoverDetail'];
  onLeaveDetail?: () => void;
}

export function RecipeBookVirtualRow({
  recipeRow,
  index,
  top,
  measureRef,
  onCraft,
  onToggleFavoriteRecipe,
  onHoverDetail,
  onLeaveDetail,
}: RecipeBookVirtualRowProps) {
  const {
    actionLabel,
    canCraft,
    craftCount,
    recipe,
    recipeOutput,
    requiredStructureLabel,
    tintOverride,
    tooltipLines,
  } = recipeRow;

  return (
    <div
      ref={measureRef}
      data-index={index}
      className={styles.virtualRow}
      style={virtualRowStyle(top)}
    >
      <div
        className={[styles.entry, recipe.learned ? '' : styles.entryDisabled]
          .filter(Boolean)
          .join(' ')}
      >
        {recipe.learned ? (
          <ItemSlotButton
            item={recipeOutput}
            size="compact"
            disabled={!recipe.learned}
            tintOverride={tintOverride}
            onClick={canCraft ? () => onCraft(recipe.id, 1) : undefined}
            onMouseEnter={(event) =>
              onHoverDetail?.(
                event,
                recipe.name,
                tooltipLines ?? [],
                tintOverride,
              )
            }
            onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
          />
        ) : (
          <span
            onMouseEnter={(event) =>
              onHoverDetail?.(
                event,
                recipe.name,
                tooltipLines ?? [],
                tintOverride,
              )
            }
            onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
          >
            <ItemSlotButton
              item={recipeOutput}
              size="compact"
              disabled={!recipe.learned}
              tintOverride={tintOverride}
              borderColorOverride={tintOverride}
            />
          </span>
        )}
        <div className={styles.meta}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{recipe.name}</span>
          </div>
          <div className={styles.description}>{recipe.description}</div>
          <div className={styles.site}>
            {t('ui.recipeBook.siteLabel', {
              site: requiredStructureLabel,
            })}
          </div>
        </div>
        <div className={styles.actions}>
          {recipe.learned ? (
            canCraft ? (
              <span className={styles.actionButtonRow}>
                <span className={styles.craftCount}>{`x${craftCount}`}</span>
                <Button
                  type="button"
                  onClick={(event) =>
                    onCraft(recipe.id, getRecipeCraftCount(event))
                  }
                  onMouseEnter={(event) =>
                    onHoverDetail?.(
                      event,
                      t('ui.recipeBook.tooltip.batchCraftTitle'),
                      [
                        {
                          kind: 'text',
                          text: t('ui.recipeBook.tooltip.batchCraftShift'),
                        },
                        {
                          kind: 'text',
                          text: t('ui.recipeBook.tooltip.batchCraftCtrl'),
                        },
                      ],
                    )
                  }
                  onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
                >
                  {actionLabel}
                </Button>
              </span>
            ) : (
              <span
                onMouseEnter={(event) =>
                  onHoverDetail?.(event, recipe.name, tooltipLines ?? [])
                }
                onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
              >
                <Button type="button" disabled={!canCraft}>
                  {actionLabel}
                </Button>
              </span>
            )
          ) : (
            <span
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  recipe.name,
                  tooltipLines ?? [],
                  tintOverride,
                )
              }
              onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
            >
              <Button type="button" disabled={!recipe.learned}>
                {actionLabel}
              </Button>
            </span>
          )}
          <Button
            unstyled
            type="button"
            className={styles.favoriteButton}
            onClick={() => onToggleFavoriteRecipe(recipe.id)}
            onMouseEnter={(event) =>
              onHoverDetail?.(
                event,
                recipe.favorite
                  ? t('ui.recipeBook.favoriteAction.unfavoriteLabel')
                  : t('ui.recipeBook.favoriteAction.favoriteLabel'),
                [
                  {
                    kind: 'text',
                    text: recipe.favorite
                      ? t('ui.recipeBook.favoriteAction.unfavoriteHint')
                      : t('ui.recipeBook.favoriteAction.favoriteHint'),
                  },
                ],
              )
            }
            onMouseLeave={onHoverDetail ? onLeaveDetail : undefined}
            aria-label={`${recipe.favorite ? t('ui.recipeBook.favoriteAction.unfavoriteLabel') : t('ui.recipeBook.favoriteAction.favoriteLabel')}: ${recipe.name}`}
            aria-pressed={recipe.favorite}
            disabled={!recipe.learned}
          >
            <span
              aria-hidden="true"
              className={styles.favoriteIcon}
              style={starIconMask(
                roundStarIcon,
                recipe.favorite
                  ? ICON_TINT_COLORS.favorite
                  : ICON_TINT_COLORS.muted,
              )}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

function starIconMask(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}

function virtualRowStyle(top: number): CSSProperties {
  return {
    left: 0,
    position: 'absolute',
    top: 0,
    transform: `translateY(${top}px)`,
    width: '100%',
  };
}
