import { memo } from 'react';
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
          <button
            key={tab.id}
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
          </button>
        );
      })}
    </div>
  );
});
