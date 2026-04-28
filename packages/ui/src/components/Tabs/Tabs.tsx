import { memo } from 'react';
import { Button } from '../Button/Button';
import styles from './styles.module.scss';

export interface TabDefinition {
  id: string;
  label: string;
}

interface TabsProps {
  activeTabId: string;
  tabs: TabDefinition[];
  onChange: (tabId: string) => void;
}

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
            data-selected={selected}
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
