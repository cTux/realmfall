import type { ReactNode } from 'react';

export interface WindowLabelParts {
  prefix: string;
  hotkey?: string;
  suffix: string;
}

export interface WindowLabelProps {
  label: WindowLabelParts;
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

function stripHotkeyBracketGlyphs(segment: string) {
  return segment.replace(/[()]/g, '');
}
