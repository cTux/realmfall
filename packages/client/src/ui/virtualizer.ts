import type { Virtualizer } from '@tanstack/react-virtual';

type ElementVirtualizer = Virtualizer<HTMLDivElement, HTMLElement>;
type Rect = { height: number; width: number };

function measureRect(element: HTMLDivElement, fallbackRect: Rect): Rect {
  return {
    height: element.offsetHeight || fallbackRect.height,
    width: element.offsetWidth || fallbackRect.width,
  };
}

export function observeElementRectWithFallback(fallbackRect: Rect) {
  return (instance: ElementVirtualizer, cb: (rect: Rect) => void) => {
    const element = instance.scrollElement;
    const targetWindow = instance.targetWindow;
    if (!element || !targetWindow) return;

    const emitRect = () => {
      cb(measureRect(element, fallbackRect));
    };

    emitRect();

    if (!targetWindow.ResizeObserver) {
      return () => {};
    }

    const observer = new targetWindow.ResizeObserver(() => {
      emitRect();
    });
    observer.observe(element, { box: 'border-box' });

    return () => {
      if (typeof observer.unobserve === 'function') {
        observer.unobserve(element);
        return;
      }
      observer.disconnect();
    };
  };
}

export function measureElementWithFallback(fallbackSize: number) {
  return (element: HTMLElement | null) => {
    if (!element) return fallbackSize;
    return (
      element.offsetHeight ||
      element.getBoundingClientRect().height ||
      fallbackSize
    );
  };
}

export function scrollElementToOffset(
  offset: number,
  options: { adjustments?: number; behavior?: ScrollBehavior },
  instance: ElementVirtualizer,
) {
  const target = instance.scrollElement;
  if (!target) return;

  const nextOffset = offset + (options.adjustments ?? 0);

  if (typeof target.scrollTo === 'function') {
    target.scrollTo({
      behavior: options.behavior,
      top: nextOffset,
    });
    return;
  }

  target.scrollTop = nextOffset;
  target.dispatchEvent(new Event('scroll'));
}
