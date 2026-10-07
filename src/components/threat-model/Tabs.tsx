import { useRef, type KeyboardEvent } from 'react';

export interface TabItem<TabId extends string> {
  id: TabId;
  label: string;
}

interface Props<TabId extends string> {
  /** Accessible name of the tab list. */
  label: string;
  /** Unique on the page; ties each tab to its panel. */
  idPrefix: string;
  tabs: readonly TabItem<TabId>[];
  activeId: TabId;
  onSelect: (tabId: TabId) => void;
}

function tabElementId(idPrefix: string, tabId: string): string {
  return `${idPrefix}-tab-${tabId}`;
}

/** Spread onto the element that shows the active tab's content. */
export function tabPanelProps(idPrefix: string, activeId: string) {
  return { role: 'tabpanel', id: `${idPrefix}-panel`, 'aria-labelledby': tabElementId(idPrefix, activeId), tabIndex: 0 } as const;
}

/**
 * A tab list that works from the keyboard: one tab stop, arrow keys to move between
 * tabs, Home and End to jump to the ends.
 */
export default function Tabs<TabId extends string>({ label, idPrefix, tabs, activeId, onSelect }: Props<TabId>) {
  const listRef = useRef<HTMLDivElement>(null);

  const moveTo = (index: number): void => {
    const target = tabs[(index + tabs.length) % tabs.length];
    onSelect(target.id);
    listRef.current?.querySelector<HTMLButtonElement>(`#${tabElementId(idPrefix, target.id)}`)?.focus();
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
    const targets: Record<string, number> = { ArrowRight: activeIndex + 1, ArrowLeft: activeIndex - 1, Home: 0, End: tabs.length - 1 };
    const targetIndex = targets[event.key];
    if (targetIndex === undefined) return;
    event.preventDefault();
    moveTo(targetIndex);
  };

  return (
    <div ref={listRef} className="tm-tabs tm-no-print" role="tablist" aria-label={label} onKeyDown={handleKey}>
      {tabs.map((tab) => (
        <button
          key={tab.id} type="button" role="tab" className="tm-tab"
          id={tabElementId(idPrefix, tab.id)} aria-controls={`${idPrefix}-panel`}
          aria-selected={tab.id === activeId} tabIndex={tab.id === activeId ? 0 : -1}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
