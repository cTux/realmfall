const COMPACT_SUFFIXES = [
  { value: 1_000_000_000, suffix: 'B' },
  { value: 1_000_000, suffix: 'M' },
  { value: 1_000, suffix: 'K' },
];

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

  return `${value}`;
}

export function formatCompactNumberish(value: string): string {
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(value)) return value;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;

  const prefix = value.startsWith('+') && numericValue >= 0 ? '+' : '';
  return `${prefix}${formatCompactNumber(numericValue)}`;
}
