import { memo, type ComponentType, type FC, type ReactNode } from 'react';
import {
  DeferredWindowShell,
  type DeferredWindowShellProps,
} from './DeferredWindowShell';
import { createLazyWindowComponent } from './lazyWindowComponent';

interface CreateDeferredWindowComponentOptions<
  WindowProps extends object,
  ContentProps extends object,
> {
  displayName: string;
  loadContent: () => Promise<{ default: ComponentType<ContentProps> }>;
  mapContentProps: (props: WindowProps) => ContentProps;
  mapWindowProps: (
    props: WindowProps,
  ) => Omit<DeferredWindowShellProps<ContentProps>, 'content' | 'contentProps'>;
  memoize?: boolean;
  wrapShell?: (shell: ReactNode, props: WindowProps) => ReactNode;
}

export function createDeferredWindowComponent<
  WindowProps extends object,
  ContentProps extends object,
>({
  displayName,
  loadContent,
  mapContentProps,
  mapWindowProps,
  memoize = true,
  wrapShell,
}: CreateDeferredWindowComponentOptions<WindowProps, ContentProps>) {
  const Content = createLazyWindowComponent(loadContent);

  const WindowComponent: FC<WindowProps> = (props) => {
    const shell = (
      <DeferredWindowShell
        {...mapWindowProps(props)}
        content={Content}
        contentProps={mapContentProps(props)}
      />
    );
    return wrapShell ? wrapShell(shell, props) : shell;
  };

  WindowComponent.displayName = displayName;
  return memoize ? memo(WindowComponent) : WindowComponent;
}
