import type { ReactNode } from 'react';
import { stripHotkeyBracketGlyphs } from '../../hotkeyLabels';
import type { WindowLabelDefinition } from '../../windowLabels';

interface WindowLabelProps {
  label: WindowLabelDefinition;
  hotkeyClassName: string;
  suffix?: ReactNode;
}

export function WindowLabel({
  label,
  hotkeyClassName,
  suffix,
}: WindowLabelProps) {
  return (
    <>
      {stripHotkeyBracketGlyphs(label.prefix)}
      {label.hotkey ? (
        <span className={hotkeyClassName}>{label.hotkey}</span>
      ) : null}
      {stripHotkeyBracketGlyphs(label.suffix)}
      {suffix}
    </>
  );
}
