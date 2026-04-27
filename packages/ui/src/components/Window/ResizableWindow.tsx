import { Window } from './Window';
import type { WindowProps } from './types';
import styles from './styles.module.scss';

interface ResizableWindowProps extends WindowProps {
  scrollableBody?: boolean;
}

export function ResizableWindow({
  bodyClassName,
  scrollableBody = true,
  ...windowProps
}: ResizableWindowProps) {
  const mergedBodyClassName = `${scrollableBody ? styles.windowBodyScrollable : ''} ${
    bodyClassName ?? ''
  }`.trim();

  return <Window {...windowProps} bodyClassName={mergedBodyClassName} />;
}
