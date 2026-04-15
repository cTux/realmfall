import {
  useEffect,
  useRef,
  type JSX,
  type MouseEvent,
  type MutableRefObject,
} from 'react';
import {
  resetTooltipState,
  setTooltipState,
  useTooltipState,
} from '../../../app/App/tooltipStore';
import type { TooltipItem } from '../../../app/App/types';
import { rarityColor } from '../../rarity';
import { itemTooltipLines, type TooltipLine } from '../../tooltips';
import { getTooltipPlacementForRect } from '../../tooltipPlacement';
import { GameTooltip, type TooltipPosition } from '../GameTooltip';

type StoryArgs = Record<string, unknown>;

interface StorybookPreviewRuntimeProps {
  Story: (props?: { args?: StoryArgs }) => JSX.Element | null;
  args: StoryArgs;
}

function showTooltipAtTarget(
  event: MouseEvent<HTMLElement>,
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>,
  title: string,
  lines: TooltipLine[],
  borderColor?: string,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const position = getTooltipPlacementForRect(rect);

  tooltipPositionRef.current = position;
  setTooltipState({
    title,
    lines,
    x: position.x,
    y: position.y,
    placement: position.placement,
    borderColor,
  });
}

function createInjectedArgs(
  args: StoryArgs,
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>,
) {
  const nextArgs: StoryArgs = {};

  if ('onHoverDetail' in args) {
    nextArgs.onHoverDetail = (
      event: MouseEvent<HTMLElement>,
      title: string,
      lines: TooltipLine[],
      borderColor?: string,
    ) => {
      showTooltipAtTarget(event, tooltipPositionRef, title, lines, borderColor);
    };
  }

  if ('onLeaveDetail' in args) {
    nextArgs.onLeaveDetail = () => {
      tooltipPositionRef.current = null;
      setTooltipState(null);
    };
  }

  if ('onHoverItem' in args) {
    nextArgs.onHoverItem = (
      event: MouseEvent<HTMLElement>,
      item: TooltipItem,
      equipped?: TooltipItem,
    ) => {
      showTooltipAtTarget(
        event,
        tooltipPositionRef,
        item.name,
        itemTooltipLines(item, equipped),
        rarityColor(item.rarity),
      );
    };
  }

  if ('onLeaveItem' in args) {
    nextArgs.onLeaveItem = () => {
      tooltipPositionRef.current = null;
      setTooltipState(null);
    };
  }

  return nextArgs;
}

export function StorybookPreviewRuntime({
  Story,
  args,
}: StorybookPreviewRuntimeProps) {
  const tooltipPositionRef = useRef<TooltipPosition | null>(null);
  const tooltip = useTooltipState();

  useEffect(() => () => resetTooltipState(), []);

  return (
    <>
      <Story
        args={{ ...args, ...createInjectedArgs(args, tooltipPositionRef) }}
      />
      <GameTooltip tooltip={tooltip} positionRef={tooltipPositionRef} />
    </>
  );
}
