import type { DashboardSummary } from '../types';
import { formatCurrency } from '../lib/analytics';

interface Props {
  summary: DashboardSummary;
}

const cards = [
  { key: 'income', label: 'Entradas', field: 'totalIncome' as const, accent: 'var(--green)' },
  { key: 'expense', label: 'Saídas', field: 'totalExpense' as const, accent: 'var(--red)' },
  {
    key: 'balance',
    label: 'Sobra do fluxo',
    field: 'netBalance' as const,
    accent: 'var(--blue)',
  },
  { key: 'daily', label: 'Média diária de gastos', field: 'avgDailyExpense' as const, accent: 'var(--orange)' },
];

export function SummaryCards({ summary }: Props) {
  return (
    <section className="summary-grid">
      {cards.map((card) => {
        const value = summary[card.field];
        const isBalance = card.key === 'balance';

        return (
          <article key={card.key} className="summary-card" style={{ borderColor: card.accent }}>
            <span className="summary-label">{card.label}</span>
            <strong
              className="summary-value"
              style={isBalance ? { color: value >= 0 ? 'var(--blue)' : 'var(--red)' } : undefined}
            >
              {formatCurrency(value)}
            </strong>
            {card.key === 'balance' && (
              <>
                <span className="summary-meta">
                  {summary.savingsRate.toFixed(1)}% das entradas ficaram de sobra no fluxo
                </span>
                <span className="summary-meta summary-meta--hint">
                  Não é o guardado na caixinha — veja a seção abaixo
                </span>
              </>
            )}
            {card.key === 'daily' && (
              <span className="summary-meta">{summary.transactionCount} movimentações</span>
            )}
          </article>
        );
      })}
    </section>
  );
}
