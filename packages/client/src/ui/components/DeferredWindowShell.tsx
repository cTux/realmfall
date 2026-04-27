import {
  Suspense,
  createElement,
  type ReactNode,
  type ComponentProps,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { WindowLoadingState } from './WindowLoadingState';
import { WindowShell } from './WindowShell';

export type DeferredWindowShellProps<ContentProps extends object> = Omit<
  ComponentProps<typeof WindowShell>,
  'children'
> & {
  content: LazyExoticComponent<ComponentType<ContentProps>>;
  contentProps: ContentProps;
};

export function DeferredWindowShell<ContentProps extends object>({
  content: Content,
  contentProps,
  title,
  ...windowProps
}: DeferredWindowShellProps<ContentProps> & { title: ReactNode }) {
  return (
    <WindowShell {...windowProps} title={title}>
      <Suspense fallback={<WindowLoadingState />}>
        {createElement(Content, contentProps)}
      </Suspense>
    </WindowShell>
  );
}
