const COMPACT_SUFFIXES = [
  { value: 1_000_000_000, suffix: 'B' },
  { value: 1_000_000, suffix: 'M' },
  { value: 1_000, suffix: 'k' },
];
const INTEGER_DISPLAY_EPSILON = 1e-6;
const PLAIN_NUMBER_DECIMAL_PLACES = 2;

function roundForDisplay(value: number, decimalPlaces: number): number {
  const scale = 10 ** decimalPlaces;
  const epsilon = Number.EPSILON * (value === 0 ? 1 : Math.sign(value));
  return Math.round((value + epsilon) * scale) / scale;
}

function formatPlainNumber(value: number): string {
  const roundedInteger = Math.round(value);
  if (Math.abs(value - roundedInteger) <= INTEGER_DISPLAY_EPSILON) {
    return `${roundedInteger}`;
  }

  const rounded = roundForDisplay(value, PLAIN_NUMBER_DECIMAL_PLACES);
  if (Number.isInteger(rounded)) return `${rounded}`;

  return rounded.toFixed(PLAIN_NUMBER_DECIMAL_PLACES).replace(/\.?0+$/, '');
}

export function formatCompactNumber(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absoluteValue = Math.abs(value);

  for (const { value: threshold, suffix } of COMPACT_SUFFIXES) {
    if (absoluteValue < threshold) continue;

    const compact = absoluteValue / threshold;
    const rounded =
      compact >= 10 ? Math.round(compact) : Math.round(compact * 10) / 10;
    const text = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
    return `${sign}${text}${suffix}`;
  }

  return formatPlainNumber(value);
}

export function formatCompactNumberish(value: string): string {
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(value)) return value;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;

  const prefix = value.startsWith('+') && numericValue >= 0 ? '+' : '';
  return `${prefix}${formatCompactNumber(numericValue)}`;
}
