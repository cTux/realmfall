interface GraphemeSegment {
  segment: string;
}

interface GraphemeSegmenterLike {
  segment(input: string): Iterable<GraphemeSegment>;
}

const segmenterCtor = (
  Intl as typeof Intl & {
    Segmenter?: new (
      locales?: string | string[],
      options?: { granularity: 'grapheme' },
    ) => GraphemeSegmenterLike;
  }
).Segmenter;
const graphemeSegmenter = segmenterCtor
  ? new segmenterCtor(undefined, { granularity: 'grapheme' })
  : null;

export interface DisplayText {
  text: string;
  units: string[];
}

export function createDisplayText(text: string): DisplayText {
  return {
    text,
    units: splitDisplayText(text),
  };
}

export function takeVisibleDisplayText(
  displayText: DisplayText,
  visibleCount: number,
) {
  if (
    !Number.isFinite(visibleCount) ||
    visibleCount >= displayText.units.length
  ) {
    return displayText.text;
  }

  if (visibleCount <= 0) {
    return '';
  }

  return displayText.units.slice(0, visibleCount).join('');
}

function splitDisplayText(text: string) {
  if (!text) {
    return [];
  }

  if (!graphemeSegmenter) {
    return Array.from(text);
  }

  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}
