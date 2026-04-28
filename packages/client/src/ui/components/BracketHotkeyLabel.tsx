import { parseBracketHotkeyLabel } from '../hotkeyLabels';

interface BracketHotkeyLabelProps {
  label: string;
  hotkeyClassName: string;
}

export function BracketHotkeyLabel({
  label,
  hotkeyClassName,
}: BracketHotkeyLabelProps) {
  const { plain, prefix, hotkey, suffix } = parseBracketHotkeyLabel(label);
  if (!hotkey) {
    return plain;
  }

  return (
    <>
      {prefix}
      <span className={hotkeyClassName}>{hotkey}</span>
      {suffix}
    </>
  );
}
