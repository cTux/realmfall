# Unified Button Surface Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Slate Lift button-surface system across shared and client button-like controls, keep destructive actions accented, and replace the dedicated close-button component with ordinary `Button` usage plus inline icon content.

**Architecture:** Put the canonical palette tokens and control-surface mixins in `packages/client/src/styles/_ui.scss`, and let `packages/ui` consume them through the existing forwarder. Standard buttons go through the shared `Button` component plus a small `tone` contract, while title-bar controls, tabs, dock buttons, chips, and other bespoke surfaces keep their class-based wrappers but rebuild those wrappers on the same mixins so resting, hover, active, and destructive states stay aligned.

**Tech Stack:** React 19, TypeScript, SCSS modules, Vitest jsdom, Storybook, pnpm workspaces.

---

### File Structure

- Modify `packages/client/src/styles/_ui.scss`: define the canonical Slate Lift tokens and mixins for neutral, destructive, compact, header, tab, dock, and chip control surfaces.
- Modify `packages/ui/src/components/Button/Button.tsx`: add a `tone` prop and emit `data-tone` for shared destructive-button support.
- Modify `packages/ui/src/components/Button/styles.module.scss`: route the default Button visuals through the shared mixins.
- Modify `packages/ui/src/components/Button/Button.test.tsx`: cover the `data-tone` contract and keep the `size="small"` contract.
- Modify `packages/ui/src/components/Button/Button.stories.tsx`: show the shared surface states for default, danger, small, and icon-only buttons.
- Modify `packages/ui/src/components/Tabs/Tabs.tsx`: render tab triggers through `Button` instead of raw `<button>`.
- Modify `packages/ui/src/components/Tabs/styles.module.scss`: replace the transparent tab surface with the filled Slate Lift tab mixin.
- Create `packages/ui/src/components/Tabs/Tabs.test.tsx`: cover selection state and click wiring in the shared Tabs component.
- Modify `packages/ui/src/components/Tabs/Tabs.stories.tsx`: expose the filled selected and resting tab surfaces in Storybook.
- Modify `packages/ui/src/components/DockPanel/WindowDock.tsx`: render dock entries through `Button` instead of raw `<button>`.
- Modify `packages/ui/src/components/DockPanel/styles.module.scss`: rebuild dock buttons on the shared dock surface mixin and brighten the opened state.
- Create `packages/ui/src/components/DockPanel/WindowDock.test.tsx`: cover shared dock focus-tooltip and toggle behavior.
- Modify `packages/ui/src/components/DockPanel/WindowDock.stories.tsx`: keep the opened and attention dock states visible under the new palette.
- Modify `packages/ui/src/components/Window/WindowFrame.tsx`: replace the `WindowCloseIcon` fallback with inline icon content inside the existing `Button`.
- Modify `packages/ui/src/components/Window/styles.module.scss`: move title-bar buttons to the shared header-button mixin and host the inline close-icon glyph class.
- Modify `packages/ui/src/components/Window/Window.test.tsx`: assert that the close button remains a small Button and now exposes the inline icon marker.
- Delete `packages/ui/src/components/Window/WindowCloseIcon.tsx` and `packages/ui/src/components/Window/WindowCloseIcon.module.scss`: remove the dedicated close-button component abstraction.
- Modify `packages/ui/src/index.ts`: drop the `WindowCloseIcon` export.
- Modify `packages/client/src/ui/components/DraggableWindow/DraggableWindowFrame.tsx`: replace the shared close-icon component import with inline icon content while keeping the close control as a normal `Button`.
- Modify `packages/client/src/ui/components/DraggableWindow/styles.module.scss`: rebuild the draggable title controls on the shared header-button mixin and inline close-icon class.
- Modify `packages/client/src/ui/components/WindowHeaderActionButton.tsx`: align header action buttons with the same unstyled small Button surface contract as the close button.
- Modify `packages/client/src/ui/components/WindowHeaderActionButton.test.tsx`: keep the small-button contract covered after the title-bar refactor.
- Modify `packages/client/src/ui/uiWindowShells.test.tsx`: assert the shared and draggable close buttons now render the inline close-icon marker.
- Modify `packages/client/src/ui/components/WindowDock/styles.module.scss`: rebuild client dock buttons on the shared dock surface mixin and brighten the opened state.
- Modify `packages/client/src/ui/components/GameSettingsWindow/styles.module.scss`: move settings tabs, theme presets, save actions, and reset buttons onto the shared tab, neutral, and destructive surface mixins.
- Modify `packages/client/src/ui/components/RecipeBookWindow/styles.module.scss`: move recipe tabs, slot-filter controls, load-more, and favorite buttons onto the shared surface mixins without changing their behavior.
- Modify `packages/client/src/ui/components/LogWindow/styles.module.scss`: rebuild filter chips and the filter-menu trigger on the shared filled chip and header surfaces while preserving checkbox semantics.
- Modify `docs/specs/reference/technical-solutions/ui-component-library/spec.md`: document the shipped shared button-surface system and remove the obsolete dedicated close-icon export from the component-library description.

### Task 1: Add Shared Surface Tokens And Button Tone Support

**Files:**

- Modify: `packages/client/src/styles/_ui.scss`
- Modify: `packages/ui/src/components/Button/Button.tsx`
- Modify: `packages/ui/src/components/Button/styles.module.scss`
- Modify: `packages/ui/src/components/Button/Button.test.tsx`
- Modify: `packages/ui/src/components/Button/Button.stories.tsx`

- [ ] **Step 1: Write the failing shared Button tone test**

Add this case to `packages/ui/src/components/Button/Button.test.tsx`:

```tsx
it('marks destructive buttons with the shared tone attribute', async () => {
  await act(async () => {
    root.render(<Button tone="danger">Delete save</Button>);
  });

  const button = host.querySelector('button');
  expect(button?.getAttribute('data-tone')).toBe('danger');
});
```

- [ ] **Step 2: Run the shared Button test and verify it fails**

Run:

```bash
pnpm --filter @realmfall/ui exec vitest run --environment jsdom src/components/Button/Button.test.tsx
```

Expected: FAIL because `Button` does not accept `tone` yet, or because the rendered element does not expose `data-tone="danger"`.

- [ ] **Step 3: Add the shared Slate Lift tokens, mixins, and Button tone contract**

Update `packages/client/src/styles/_ui.scss` with the canonical control-surface tokens and mixins:

```scss
$title-bar-background: #0f172a;
$surface-fill-rest: rgb(30 41 59 / 92%);
$surface-fill-hover: rgb(51 65 85 / 94%);
$surface-fill-active: rgb(71 85 105 / 96%);
$surface-border-rest: rgb(71 85 105 / 72%);
$surface-border-hover: rgb(125 211 252 / 55%);
$surface-text-rest: #dbe4f0;
$surface-text-strong: #f8fafc;
$danger-fill-rest: rgb(127 29 29 / 92%);
$danger-fill-hover: rgb(153 27 27 / 94%);
$danger-fill-active: rgb(185 28 28 / 96%);
$danger-border-rest: rgb(248 113 113 / 44%);
$danger-border-hover: rgb(251 146 60 / 62%);

@mixin control-surface-base {
  appearance: none;
  border-width: 1px;
  border-style: solid;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;

  &:focus-visible {
    outline: 2px solid rgb(125 211 252 / 80%);
    outline-offset: 2px;
  }

  &:disabled,
  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

@mixin control-surface($tone: default) {
  @include control-surface-base;

  @if $tone == danger {
    border-color: $danger-border-rest;
    background: $danger-fill-rest;
    color: #fee2e2;

    &:hover:enabled,
    &:hover:not([aria-disabled='true']) {
      border-color: $danger-border-hover;
      background: $danger-fill-hover;
      color: #fff1f2;
    }

    &[aria-pressed='true'],
    &[aria-selected='true'],
    &[data-active='true'],
    &[data-opened='true'] {
      background: $danger-fill-active;
      color: #fff7ed;
    }
  } @else {
    border-color: $surface-border-rest;
    background: $surface-fill-rest;
    color: $surface-text-rest;

    &:hover:enabled,
    &:hover:not([aria-disabled='true']) {
      border-color: $surface-border-hover;
      background: $surface-fill-hover;
      color: $surface-text-strong;
    }

    &[aria-pressed='true'],
    &[aria-selected='true'],
    &[data-active='true'],
    &[data-opened='true'] {
      background: $surface-fill-active;
      color: $surface-text-strong;
      box-shadow: inset 0 0 0 1px rgb(148 163 184 / 18%);
    }
  }
}

@mixin compact-button {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.15;
}

@mixin window-header-button {
  @include control-surface();
  @include compact-button;

  border-radius: $ability-radius;
}

@mixin tab-surface {
  @include control-surface();

  border-radius: 0 0.8rem;
}

@mixin dock-button-surface {
  @include control-surface();

  border-radius: $ability-radius;
}

@mixin chip-surface {
  @include control-surface();

  border-radius: $ability-radius;
}
```

Update `packages/ui/src/components/Button/Button.tsx`:

```tsx
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'default' | 'small';
  tone?: 'default' | 'danger';
  unstyled?: boolean;
};

export function Button({
  type = 'button',
  children,
  className,
  size = 'default',
  tone = 'default',
  unstyled = false,
  ...props
}: ButtonProps) {
  const classList = [unstyled ? '' : styles.button, className]
    .filter(Boolean)
    .join(' ');
  const resolvedSize = size === 'default' ? undefined : size;
  const resolvedTone = tone === 'default' ? undefined : tone;

  return (
    <button
      type={type}
      className={classList}
      data-size={resolvedSize}
      data-tone={resolvedTone}
      {...props}
    >
      {children}
    </button>
  );
}
```

Update `packages/ui/src/components/Button/styles.module.scss`:

```scss
@use '../../styles/ui';

.button {
  @include ui.control-surface();

  border-radius: 0 0.8rem;
  padding: 0.4rem 0.9rem;
  min-height: 2.05rem;
  font-size: 0.9rem;
  line-height: 1.15;

  &[data-tone='danger'] {
    @include ui.control-surface(danger);
  }

  &[data-size='small'] {
    @include ui.compact-button;

    min-height: 1.6rem;
  }
}
```

Update `packages/ui/src/components/Button/Button.stories.tsx`:

```tsx
export const Danger: Story = {
  args: {
    tone: 'danger',
    children: 'Delete save',
  },
};

export const IconOnlySmall: Story = {
  args: {
    size: 'small',
    'aria-label': 'Close',
    children: (
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
        <path
          d="M2 2 10 10M10 2 2 10"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};
```

- [ ] **Step 4: Run the shared Button test again**

Run:

```bash
pnpm --filter @realmfall/ui exec vitest run --environment jsdom src/components/Button/Button.test.tsx
```

Expected: PASS for the existing small-size test and the new destructive-tone test.

### Task 2: Move Shared Tabs, Dock, And Window Title Controls Onto The New Surface System

**Files:**

- Modify: `packages/ui/src/components/Tabs/Tabs.tsx`
- Modify: `packages/ui/src/components/Tabs/styles.module.scss`
- Create: `packages/ui/src/components/Tabs/Tabs.test.tsx`
- Modify: `packages/ui/src/components/Tabs/Tabs.stories.tsx`
- Modify: `packages/ui/src/components/DockPanel/WindowDock.tsx`
- Modify: `packages/ui/src/components/DockPanel/styles.module.scss`
- Create: `packages/ui/src/components/DockPanel/WindowDock.test.tsx`
- Modify: `packages/ui/src/components/DockPanel/WindowDock.stories.tsx`
- Modify: `packages/ui/src/components/Window/WindowFrame.tsx`
- Modify: `packages/ui/src/components/Window/styles.module.scss`
- Modify: `packages/ui/src/components/Window/Window.test.tsx`
- Delete: `packages/ui/src/components/Window/WindowCloseIcon.tsx`
- Delete: `packages/ui/src/components/Window/WindowCloseIcon.module.scss`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Add failing shared tests for tabs, dock, and the inline close icon**

Create `packages/ui/src/components/Tabs/Tabs.test.tsx`:

```tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('keeps the selected tab state and forwards tab clicks', async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        <Tabs
          activeTabId="graphics"
          tabs={[
            { id: 'graphics', label: 'Graphics' },
            { id: 'audio', label: 'Audio' },
          ]}
          onChange={onChange}
        />,
      );
    });

    const tabs = Array.from(host.querySelectorAll('[role="tab"]'));
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('false');

    await act(async () => {
      tabs[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('audio');
  });
});
```

Create `packages/ui/src/components/DockPanel/WindowDock.test.tsx`:

```tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { WindowDock } from './WindowDock';
import { WINDOW_LABELS } from '../../windowLabels';

describe('WindowDock', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('shows a tooltip on focus and toggles the selected entry', async () => {
    const onToggle = vi.fn();

    await act(async () => {
      root.render(
        <WindowDock
          entries={[
            {
              key: 'hero',
              label: 'Hero',
              title: WINDOW_LABELS.hero,
              icon: '/icons/hero.svg',
              shown: true,
            },
          ]}
          onToggle={onToggle}
        />,
      );
    });

    const button = host.querySelector('button');
    expect(button?.getAttribute('aria-pressed')).toBe('true');

    await act(async () => {
      button?.focus();
    });

    expect(host.textContent).toContain('(H)ero info');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onToggle).toHaveBeenCalledWith('hero');
  });
});
```

Tighten `packages/ui/src/components/Window/Window.test.tsx` with:

```tsx
const closeIcon = closeButton?.querySelector('[data-close-icon="true"]');
expect(closeIcon).not.toBeNull();
```

- [ ] **Step 2: Run the shared window-surface tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/ui exec vitest run --environment jsdom src/components/Window/Window.test.tsx src/components/Tabs/Tabs.test.tsx src/components/DockPanel/WindowDock.test.tsx
```

Expected: FAIL because the new test files do not exist yet and the current close button does not expose `data-close-icon="true"`.

- [ ] **Step 3: Migrate the shared tabs, dock, and close button implementation**

Update `packages/ui/src/components/Tabs/Tabs.tsx`:

```tsx
import { memo } from 'react';
import { Button } from '../Button/Button';
import styles from './styles.module.scss';

export const Tabs = memo(function Tabs({
  activeTabId,
  tabs,
  onChange,
}: TabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
      {tabs.map((tab) => {
        const selected = tab.id === activeTabId;

        return (
          <Button
            key={tab.id}
            unstyled
            id={`${tab.id}-tab`}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={selected}
            aria-controls={`${tab.id}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
});
```

Update `packages/ui/src/components/Tabs/styles.module.scss`:

```scss
@use '../../styles/ui';

.tabs {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  align-items: flex-end;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgb(148 163 184 / 18%);
}

.tab {
  @include ui.tab-surface;

  padding: 0.55rem 0.85rem 0.45rem;
  font-size: 0.85rem;
}
```

Update `packages/ui/src/components/DockPanel/WindowDock.tsx`:

```tsx
import { Button } from '../Button/Button';

function DockButton({
  entry,
  activeTooltip,
  onToggle,
  setActiveTooltip,
}: DockButtonProps) {
  const audio = useUiAudio();

  return (
    <Button
      unstyled
      type="button"
      className={styles.dockButton}
      data-opened={entry.shown}
      data-attention={entry.requiresAttention}
      data-ui-audio-click="off"
      aria-pressed={entry.shown}
      aria-label={
        entry.requiresAttention
          ? `${t('ui.dock.toggleWindow', { label: entry.label })} ${t(
              'ui.dock.requiresAttention',
            )}`
          : t('ui.dock.toggleWindow', { label: entry.label })
      }
      onClick={(event) => {
        setActiveTooltip(null);
        onToggle(entry.key);
        if (entry.shown) {
          event.currentTarget.blur();
          audio.swoosh();
          return;
        }

        event.currentTarget.blur();
        audio.pop();
      }}
      onPointerEnter={() => setActiveTooltip(entry.key)}
      onPointerLeave={() =>
        setActiveTooltip((current) => (current === entry.key ? null : current))
      }
      onFocus={() => setActiveTooltip(entry.key)}
      onBlur={() =>
        setActiveTooltip((current) => (current === entry.key ? null : current))
      }
    >
      <span
        className={styles.buttonIcon}
        style={iconMaskStyle(entry.icon)}
        aria-hidden="true"
      />
      {entry.requiresAttention ? (
        <span className={styles.attentionBadge} aria-hidden="true" />
      ) : null}
      {activeTooltip === entry.key ? (
        <span className={styles.tooltip} aria-hidden="true">
          <WindowLabel
            label={entry.title}
            hotkeyClassName={labelStyles.hotkey}
          />
        </span>
      ) : null}
    </Button>
  );
}
```

Update `packages/ui/src/components/DockPanel/styles.module.scss`:

```scss
.dockButton {
  @include ui.dock-button-surface;

  position: relative;
  width: 41px;
  height: 41px;
  display: grid;
  place-items: center;
  padding: 0.18rem;

  &:active {
    transform: translateY(1px);
  }

  &[data-opened='true'] {
    background: ui.$surface-fill-active;
    color: #f8fafc;
  }

  &:hover .tooltip,
  &:focus-visible .tooltip {
    opacity: 1;
    transform: translate(0, -50%);
  }
}
```

Update `packages/ui/src/components/Window/WindowFrame.tsx`:

```tsx
import { Button } from '../Button/Button';

const defaultCloseButtonContent = (
  <span
    className={styles.closeIcon}
    data-close-icon="true"
    aria-hidden="true"
  />
);

export function WindowFrame({
  bodyClassName,
  children,
  className,
  closeButtonAriaLabel,
  closeButtonContent,
  closeButtonTooltip,
  closeButtonTooltipColor,
  emphasis,
  headerActions,
  isEntered,
  onBlurCapture,
  onClose,
  onHeaderPointerDown,
  onHoverDetail,
  onLeaveDetail,
  onResizePointerDown,
  onWindowActivate,
  onWindowHoverEnter,
  onWindowHoverLeave,
  position,
  resizeBounds,
  showCloseButton,
  title,
  titleClassName,
  windowRef,
}: WindowFrameProps) {
  const tooltipLabel = closeButtonAriaLabel ?? closeButtonTooltip ?? 'Close';

  return (
    <section
      ref={windowRef}
      className={`${styles.floatingWindow} ${className ?? ''}`.trim()}
      data-window-emphasis={emphasis}
      data-window-visible={isEntered}
      tabIndex={-1}
      style={{
        left: position.x,
        top: position.y,
        width: position.width === undefined ? undefined : `${position.width}px`,
        height:
          position.height === undefined ? undefined : `${position.height}px`,
      }}
      onPointerEnter={onWindowHoverEnter}
      onPointerLeave={onWindowHoverLeave}
      onPointerDown={onWindowActivate}
      onFocusCapture={onWindowActivate}
      onBlurCapture={onBlurCapture}
    >
      <div className={styles.windowHeader} onPointerDown={onHeaderPointerDown}>
        <h2 className={normalizedTitleClassName}>{title}</h2>
        <div className={styles.windowHeaderActions}>
          {headerActions ? (
            <div
              className={styles.headerActions}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {headerActions}
            </div>
          ) : null}
          {canShowCloseButton ? (
            <Button
              type="button"
              size="small"
              unstyled
              className={styles.headerButton}
              data-ui-audio-click="off"
              aria-label={tooltipLabel}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.currentTarget.blur();
                onClose();
              }}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  tooltipLabel,
                  tooltipLines,
                  closeButtonColor,
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              {closeButtonContent ?? defaultCloseButtonContent}
            </Button>
          ) : null}
        </div>
      </div>
      <div className={normalizedBodyClassName}>{children}</div>
      {resizeBounds ? (
        <div
          className={styles.resizeHandle}
          onPointerDown={onResizePointerDown}
          aria-hidden="true"
        />
      ) : null}
    </section>
  );
}
```

Update `packages/ui/src/components/Window/styles.module.scss`:

```scss
@use '../../styles/ui';

.headerButton {
  @include ui.window-header-button;

  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  font-size: 0;
}

.closeIcon {
  position: relative;
  width: 0.9rem;
  height: 0.9rem;
  display: block;
  pointer-events: none;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.78rem;
    height: 2px;
    border-radius: 999px;
    background: currentcolor;
    transform-origin: center;
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
}
```

Update `packages/ui/src/index.ts` by removing:

```ts
export {
  WindowCloseIcon,
  type WindowCloseIconProps,
} from './components/Window/WindowCloseIcon';
```

- [ ] **Step 4: Run the shared surface suite and shared package build**

Run:

```bash
pnpm --filter @realmfall/ui exec vitest run --environment jsdom src/components/Button/Button.test.tsx src/components/Window/Window.test.tsx src/components/Tabs/Tabs.test.tsx src/components/DockPanel/WindowDock.test.tsx
pnpm --filter @realmfall/ui typecheck
pnpm --filter @realmfall/ui lint
pnpm --filter @realmfall/ui build
```

Expected:

- The shared Button, Window, Tabs, and WindowDock tests pass.
- `typecheck` passes without `WindowCloseIcon` references.
- `lint` passes for the new SCSS and test files.
- `build` passes for the shared package.

### Task 3: Migrate Client Title Controls And Bespoke Button-Like Surfaces

**Files:**

- Modify: `packages/client/src/ui/components/DraggableWindow/DraggableWindowFrame.tsx`
- Modify: `packages/client/src/ui/components/DraggableWindow/styles.module.scss`
- Modify: `packages/client/src/ui/components/WindowHeaderActionButton.tsx`
- Modify: `packages/client/src/ui/components/WindowHeaderActionButton.test.tsx`
- Modify: `packages/client/src/ui/uiWindowShells.test.tsx`
- Modify: `packages/client/src/ui/components/WindowDock/styles.module.scss`
- Modify: `packages/client/src/ui/components/GameSettingsWindow/styles.module.scss`
- Modify: `packages/client/src/ui/components/RecipeBookWindow/styles.module.scss`
- Modify: `packages/client/src/ui/components/LogWindow/styles.module.scss`

- [ ] **Step 1: Tighten the client window-shell tests so the current close icon path fails**

Update `packages/client/src/ui/uiWindowShells.test.tsx`:

```tsx
closeButtons.forEach((button) => {
  expect(button.getAttribute('data-size')).toBe('small');
  expect(button.querySelector('[data-close-icon="true"]')).not.toBeNull();
});
```

Keep `packages/client/src/ui/components/WindowHeaderActionButton.test.tsx` focused on the existing shared small-button contract:

```tsx
expect(button?.getAttribute('data-size')).toBe('small');
expect(button?.getAttribute('aria-disabled')).toBe('true');
```

- [ ] **Step 2: Run the targeted client shell tests and verify they fail**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/ui/components/WindowHeaderActionButton.test.tsx src/ui/uiWindowShells.test.tsx
```

Expected: FAIL because the current draggable close button still renders `WindowCloseIcon` without the inline `data-close-icon="true"` marker.

- [ ] **Step 3: Rebuild the client title controls, docks, settings controls, recipe controls, and log chips on the shared surface mixins**

Update `packages/client/src/ui/components/DraggableWindow/DraggableWindowFrame.tsx`:

```tsx
import { Button } from '@realmfall/ui';

const closeButtonContent = (
  <span
    className={styles.closeIcon}
    data-close-icon="true"
    aria-hidden="true"
  />
);

export function DraggableWindowFrame({
  bodyClassName,
  children,
  className,
  closeButtonTooltip,
  emphasis,
  headerActions,
  isEntered,
  onBlurCapture,
  onClose,
  onHeaderPointerDown,
  onHoverDetail,
  onLeaveDetail,
  onResizePointerDown,
  onWindowActivate,
  onWindowHoverEnter,
  onWindowHoverLeave,
  position,
  resizeBounds,
  showCloseButton,
  title,
  titleClassName,
  windowRef,
}: DraggableWindowFrameProps) {
  const audio = useUiAudio();

  return (
    <section
      ref={windowRef}
      className={`${styles.floatingWindow} ${className ?? ''}`.trim()}
      data-window-emphasis={emphasis}
      data-window-visible={isEntered}
      tabIndex={-1}
      style={{
        left: position.x,
        top: position.y,
        width: position.width === undefined ? undefined : `${position.width}px`,
        height:
          position.height === undefined ? undefined : `${position.height}px`,
      }}
      onPointerEnter={onWindowHoverEnter}
      onPointerLeave={onWindowHoverLeave}
      onPointerDown={onWindowActivate}
      onFocusCapture={onWindowActivate}
      onBlurCapture={onBlurCapture}
    >
      <div className={styles.windowHeader} onPointerDown={onHeaderPointerDown}>
        <h2 className={`${styles.windowTitle} ${titleClassName ?? ''}`.trim()}>
          {title}
        </h2>
        <div className={styles.windowHeaderActions}>
          {headerActions ? (
            <div
              className={styles.headerActions}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {headerActions}
            </div>
          ) : null}
          {showCloseButton ? (
            <Button
              size="small"
              unstyled
              type="button"
              className={styles.headerButton}
              data-ui-audio-click="off"
              aria-label={t('ui.common.close')}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.currentTarget.blur();
                audio.swoosh();
                onClose();
              }}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  t('ui.common.close'),
                  [
                    {
                      kind: 'text',
                      text: closeButtonTooltip ?? t('ui.tooltip.window.close'),
                    },
                  ],
                  'rgba(248, 113, 113, 0.9)',
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              {closeButtonContent}
            </Button>
          ) : null}
        </div>
      </div>
      <div className={`${styles.windowBody} ${bodyClassName ?? ''}`.trim()}>
        {children}
      </div>
      {resizeBounds ? (
        <div
          className={styles.resizeHandle}
          onPointerDown={onResizePointerDown}
          aria-hidden="true"
        />
      ) : null}
    </section>
  );
}
```

Update `packages/client/src/ui/components/DraggableWindow/styles.module.scss`:

```scss
.headerButton {
  @include ui.window-header-button;

  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  font-size: 0;
}

.closeIcon {
  position: relative;
  width: 0.9rem;
  height: 0.9rem;
  display: block;
  pointer-events: none;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.78rem;
    height: 2px;
    border-radius: 999px;
    background: currentcolor;
    transform-origin: center;
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
}
```

Update `packages/client/src/ui/components/WindowHeaderActionButton.tsx`:

```tsx
return (
  <Button
    unstyled
    type="button"
    size="small"
    className={className}
    aria-disabled={disabled ? 'true' : undefined}
    aria-pressed={ariaPressed}
    tabIndex={disabled ? -1 : undefined}
    data-ui-audio-click="off"
    onPointerDown={(event) => {
      event.stopPropagation();
      if (disabled) {
        event.preventDefault();
      }
    }}
    onClick={(event) => {
      event.stopPropagation();
      if (disabled) {
        return;
      }
      audio.click();
      onClick();
    }}
    onMouseEnter={(event) =>
      onHoverDetail?.(event, tooltipTitle, tooltipLines, tooltipBorderColor)
    }
    onMouseLeave={onLeaveDetail}
  >
    {children}
  </Button>
);
```

Update `packages/client/src/ui/components/WindowDock/styles.module.scss`:

```scss
.dockButton {
  @include ui.dock-button-surface;

  position: relative;
  width: 41px;
  height: 41px;
  display: grid;
  place-items: center;
  padding: 0.18rem;

  &:active {
    transform: translateY(1px);
  }

  &[data-opened='true'] {
    background: ui.$surface-fill-active;
    color: #f8fafc;
  }
}
```

Update `packages/client/src/ui/components/GameSettingsWindow/styles.module.scss`:

```scss
.tab {
  @include ui.tab-surface;

  writing-mode: vertical-rl;
  transform: rotate(180deg);
  min-height: 112px;
  padding: 0.65rem 0.45rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.themeOption {
  @include ui.control-surface();
  @include ui.compact-button;

  display: grid;
  gap: 0.3rem;
  align-content: start;
  padding: 0.65rem 0.75rem;
  text-align: left;
}

.actions button {
  @include ui.control-surface();
  @include ui.compact-button;

  padding: 0.55rem 0.85rem;
}

.saveAreaResetButton {
  @include ui.control-surface(danger);
  @include ui.compact-button;

  width: auto;
  min-height: 0;
  padding: 0.55rem 0.85rem;
  white-space: nowrap;
}
```

Update `packages/client/src/ui/components/RecipeBookWindow/styles.module.scss`:

```scss
.tab {
  @include ui.tab-surface;

  writing-mode: vertical-rl;
  transform: rotate(180deg);
  min-height: 96px;
  padding: 0.55rem 0.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.slotFilterControlButton {
  @include ui.control-surface();
  @include ui.compact-button;

  padding: 0.28rem 0.45rem;
  border-radius: 0 0.65rem;
}

.loadMoreButton {
  @include ui.control-surface();
  @include ui.compact-button;

  justify-self: start;
  padding: 0.24rem 0.55rem;
  border-radius: 0 0.65rem;
  line-height: 1.1;
}

.favoriteButton {
  @include ui.chip-surface;

  display: grid;
  place-items: center;
  min-width: 1.8rem;
  min-height: 1.8rem;
  padding: 0;
}
```

Update `packages/client/src/ui/components/LogWindow/styles.module.scss`:

```scss
.headerButton {
  @include ui.window-header-button;
}

.filterChip {
  @include ui.chip-surface;

  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  padding: 0.24rem 0.35rem;
  text-transform: capitalize;
  font-size: 0.76rem;
  line-height: 1.1;
}
```

- [ ] **Step 4: Run the targeted client suites that cover title controls, settings, recipe actions, and dock markup**

Run:

```bash
pnpm --filter @realmfall/client exec vitest run --project jsdom src/ui/components/WindowHeaderActionButton.test.tsx src/ui/uiWindowShells.test.tsx src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx src/ui/uiRecipeBookWindow.test.tsx src/ui/helpers.test.tsx
pnpm --filter @realmfall/client typecheck
pnpm --filter @realmfall/client lint
pnpm --filter @realmfall/client build
```

Expected:

- The updated close-icon assertion passes in the window-shell suite.
- The settings and recipe-book suites keep their existing behavior green.
- `typecheck`, `lint`, and `build` pass for the client package.

### Task 4: Update Shared Stories, Refresh The Component-Library Spec, And Run Final Verification

**Files:**

- Modify: `packages/ui/src/components/Button/Button.stories.tsx`
- Modify: `packages/ui/src/components/Tabs/Tabs.stories.tsx`
- Modify: `packages/ui/src/components/DockPanel/WindowDock.stories.tsx`
- Modify: `docs/specs/reference/technical-solutions/ui-component-library/spec.md`

- [ ] **Step 1: Expand Storybook coverage for the new surface system**

Add the explicit surface stories that the implementation needs to preserve:

```tsx
export const Danger: Story = {
  args: {
    tone: 'danger',
    children: 'Delete save',
  },
};

export const IconOnlySmall: Story = {
  args: {
    size: 'small',
    'aria-label': 'Close',
    children: (
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
        <path
          d="M2 2 10 10M10 2 2 10"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};
```

Keep `packages/ui/src/components/Tabs/Tabs.stories.tsx` and `packages/ui/src/components/DockPanel/WindowDock.stories.tsx` focused on resting versus selected or opened states:

```tsx
export const WithOpenedEntries: Story = {
  render: () => (
    <WindowDock
      entries={fixtures.dockEntries.map((entry, index) => ({
        ...entry,
        shown: index < 3,
      }))}
      onToggle={noop}
    />
  ),
};
```

- [ ] **Step 2: Update the canonical UI component library spec**

Add these bullets to `docs/specs/reference/technical-solutions/ui-component-library/spec.md` under `Current Solution`:

```md
- Shared buttons and button-like controls use one Slate Lift surface system: resting fills stay lighter than the window title bar, resting borders sit between the title bar and the fill, and selected or opened states use a brighter fill than resting controls.
- The shared `Button` component exposes the neutral or destructive surface choice through a `tone` prop, while title-bar buttons, tabs, dock buttons, and chip-like controls reuse the same palette through shared SCSS mixins.
- Shared window shells render their close control as an ordinary `Button` with inline icon content instead of exporting a dedicated close-button component.
```

Also remove the obsolete export note for `WindowCloseIcon` from the same spec.

- [ ] **Step 3: Run the full verification pass for both workspace packages**

Run:

```bash
pnpm --filter @realmfall/ui exec vitest run --environment jsdom src/components/Button/Button.test.tsx src/components/Window/Window.test.tsx src/components/Tabs/Tabs.test.tsx src/components/DockPanel/WindowDock.test.tsx
pnpm --filter @realmfall/client exec vitest run --project jsdom src/ui/components/WindowHeaderActionButton.test.tsx src/ui/uiWindowShells.test.tsx src/ui/components/GameSettingsWindow/GameSettingsWindowContent.test.tsx src/ui/uiRecipeBookWindow.test.tsx src/ui/helpers.test.tsx
pnpm --filter @realmfall/ui typecheck
pnpm --filter @realmfall/client typecheck
pnpm --filter @realmfall/ui lint
pnpm --filter @realmfall/client lint
pnpm --filter @realmfall/ui build
pnpm --filter @realmfall/client build
```

Expected:

- All targeted jsdom suites pass.
- Both package typechecks pass.
- Both package lint pipelines pass.
- Both package builds pass.

- [ ] **Step 4: Commit the finished implementation**

Run:

```bash
git add packages/client/src/styles/_ui.scss packages/ui/src/components/Button/Button.tsx packages/ui/src/components/Button/styles.module.scss packages/ui/src/components/Button/Button.test.tsx packages/ui/src/components/Button/Button.stories.tsx packages/ui/src/components/Tabs/Tabs.tsx packages/ui/src/components/Tabs/styles.module.scss packages/ui/src/components/Tabs/Tabs.test.tsx packages/ui/src/components/Tabs/Tabs.stories.tsx packages/ui/src/components/DockPanel/WindowDock.tsx packages/ui/src/components/DockPanel/styles.module.scss packages/ui/src/components/DockPanel/WindowDock.test.tsx packages/ui/src/components/DockPanel/WindowDock.stories.tsx packages/ui/src/components/Window/WindowFrame.tsx packages/ui/src/components/Window/styles.module.scss packages/ui/src/components/Window/Window.test.tsx packages/ui/src/index.ts packages/client/src/ui/components/DraggableWindow/DraggableWindowFrame.tsx packages/client/src/ui/components/DraggableWindow/styles.module.scss packages/client/src/ui/components/WindowHeaderActionButton.tsx packages/client/src/ui/components/WindowHeaderActionButton.test.tsx packages/client/src/ui/uiWindowShells.test.tsx packages/client/src/ui/components/WindowDock/styles.module.scss packages/client/src/ui/components/GameSettingsWindow/styles.module.scss packages/client/src/ui/components/RecipeBookWindow/styles.module.scss packages/client/src/ui/components/LogWindow/styles.module.scss docs/specs/reference/technical-solutions/ui-component-library/spec.md
git add -A packages/ui/src/components/Window
git commit -m "feat(ui): unify button surface palette"
```

Expected: A single commit that contains the shared palette, close-icon simplification, client surface migrations, and spec updates.
