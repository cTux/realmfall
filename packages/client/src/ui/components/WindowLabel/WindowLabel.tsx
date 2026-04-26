import type { ReactNode } from 'react';
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
      {label.prefix}
      {label.hotkey ? (
        <span className={hotkeyClassName}>{label.hotkey}</span>
      ) : null}
      {label.suffix}
      {suffix}
    </>
  );
}
