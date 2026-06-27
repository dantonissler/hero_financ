import type { AppTab } from '../types';

interface Props {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'extrato', label: 'Extrato' },
  { id: 'lembretes', label: 'Lembretes de gastos' },
];

export function TabNav({ active, onChange }: Props) {
  return (
    <nav className="tab-nav" aria-label="Navegação principal">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={active === tab.id ? 'tab-btn active' : 'tab-btn'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
