import { ALL_CATEGORIES } from '../types';
import type { ContainsRule } from '../lib/categoryOverrides';
import { CollapsiblePanel } from './CollapsiblePanel';

interface Props {
  rules: ContainsRule[];
  onDeleteRule: (ruleId: string) => void;
}

export function CategoryRulesPanel({ rules, onDeleteRule }: Props) {
  if (rules.length === 0) return null;

  const grouped = ALL_CATEGORIES.map((category) => ({
    category,
    rules: rules.filter((rule) => rule.category === category),
  })).filter((group) => group.rules.length > 0);

  return (
    <CollapsiblePanel
      title="Regras aprendidas"
      subtitle="Categorias salvas quando você reclassifica — aplicadas automaticamente em novos extratos"
      count={rules.length}
      defaultOpen={false}
    >
      <div className="rules-grid">
        {grouped.map((group) => (
          <section key={group.category} className="rules-group">
            <h3>{group.category}</h3>
            <ul>
              {group.rules.map((rule) => (
                <li key={rule.id}>
                  <div>
                    <strong>{rule.label}</strong>
                    <span>contém &quot;{rule.contains}&quot;</span>
                  </div>
                  <button
                    type="button"
                    className="ghost-btn ghost-btn--danger"
                    onClick={() => onDeleteRule(rule.id)}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </CollapsiblePanel>
  );
}
