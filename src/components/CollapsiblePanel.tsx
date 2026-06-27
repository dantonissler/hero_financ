import { useState, type ReactNode } from 'react';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  title: string;
  subtitle?: string;
  count?: number;
  defaultOpen?: boolean;
  filter?: T;
  filterOptions?: FilterOption<T>[];
  onFilterChange?: (value: T) => void;
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function CollapsiblePanel<T extends string>({
  title,
  subtitle,
  count,
  defaultOpen = true,
  filter,
  filterOptions,
  onFilterChange,
  headerExtra,
  children,
}: Props<T>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`panel collapsible-panel${open ? '' : ' collapsible-panel--closed'}`}>
      <header className="collapsible-header">
        <button
          type="button"
          className="collapsible-toggle"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <span className="collapsible-chevron" aria-hidden>
            {open ? '▾' : '▸'}
          </span>
          <span className="collapsible-title-group">
            <strong className="collapsible-title">{title}</strong>
            {subtitle && <span className="collapsible-subtitle">{subtitle}</span>}
            {count !== undefined && (
              <span className="collapsible-count">{count} item(ns)</span>
            )}
          </span>
        </button>

        <div className="collapsible-actions">
          {filterOptions && onFilterChange && filter !== undefined && (
            <div className="filter-group">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={filter === option.value ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => onFilterChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {headerExtra}
        </div>
      </header>

      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}
