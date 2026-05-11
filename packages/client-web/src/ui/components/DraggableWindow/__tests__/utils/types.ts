import type { DraggableWindowProps } from '../../types';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

export type WindowOnMoveMock = ReturnType<typeof vi.fn>;

export type DraggableWindowRenderConfig = Omit<
  DraggableWindowProps,
  'children'
> & {
  children?: ReactNode;
};
