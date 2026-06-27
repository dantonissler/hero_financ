import { useMemo, useState } from 'react';
import type { CaixinhaSummary } from '../lib/caixinhaAnalytics';
import { formatCurrency, formatDate } from '../lib/analytics';
import { CollapsiblePanel } from './CollapsiblePanel';

interface Props {
  summary: CaixinhaSummary;
}

type CaixinhaFilter = 'all' | 'deposit' | 'withdrawal';

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Todas' },
  { value: 'deposit' as const, label: 'Depósitos' },
  { value: 'withdrawal' as const, label: 'Retiradas' },
];

export function CaixinhaPanel({ summary }: Props) {
  const [filter, setFilter] = useState<CaixinhaFilter>('all');
  const [cardsOpen, setCardsOpen] = useState(true);

  const counts = useMemo(() => ({
    all: summary.movements.length,
    deposit: summary.depositCount,
    withdrawal: summary.withdrawalCount,
  }), [summary]);

  const visible = useMemo(() => {
    return summary.movements.filter((movement) => {
      if (filter === 'deposit') return movement.direction === 'deposit';
      if (filter === 'withdrawal') return movement.direction === 'withdrawal';
      return true;
    });
  }, [summary.movements, filter]);

  const filterOptions = FILTER_OPTIONS.map((option) => ({
    ...option,
    label: `${option.label} (${counts[option.value]})`,
  }));

  return (
    <section className="caixinha-section">
      <header className="caixinha-section-header">
        <div>
          <h2>Caixinha / Reserva</h2>
          <p>O que de fato foi guardado — depósitos e retiradas da sua reserva (RDB)</p>
        </div>
        <button
          type="button"
          className="ghost-btn ghost-btn--small"
          onClick={() => setCardsOpen((value) => !value)}
        >
          {cardsOpen ? 'Ocultar resumo' : 'Mostrar resumo'}
        </button>
      </header>

      {cardsOpen && (
        <div className="caixinha-grid">
          <article className="caixinha-card caixinha-card--highlight">
            <span className="summary-label">Total guardado na caixinha</span>
            <strong
              className="summary-value"
              style={{ color: summary.estimatedBalance >= 0 ? 'var(--green)' : 'var(--red)' }}
            >
              {formatCurrency(summary.estimatedBalance)}
            </strong>
            <span className="summary-meta">
              Depósitos − retiradas no período dos extratos
              {summary.depositCount > 0 && ` · Média por depósito: ${formatCurrency(summary.avgDeposit)}`}
            </span>
          </article>
          <article className="caixinha-card">
            <span className="summary-label">Saldo médio na caixinha</span>
            <strong className="summary-value">{formatCurrency(summary.avgDailyBalance)}</strong>
            <span className="summary-meta">Média diária no período filtrado</span>
          </article>
          <article className="caixinha-card">
            <span className="summary-label">Enviado para caixinha</span>
            <strong className="summary-value caixinha-deposit">{formatCurrency(summary.totalDeposits)}</strong>
            <span className="summary-meta">{summary.depositCount} depósito(s)</span>
          </article>
          <article className="caixinha-card">
            <span className="summary-label">Retirado da caixinha</span>
            <strong className="summary-value caixinha-withdraw">{formatCurrency(summary.totalWithdrawals)}</strong>
            <span className="summary-meta">{summary.withdrawalCount} retirada(s)</span>
          </article>
        </div>
      )}

      <CollapsiblePanel
        title="Movimentações da caixinha"
        subtitle="Reservas e resgates no período"
        count={visible.length}
        filter={filter}
        filterOptions={filterOptions}
        onFilterChange={setFilter}
      >
        {visible.length === 0 ? (
          <p className="empty-state empty-state--inline">Nenhuma movimentação para este filtro.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((movement) => (
                  <tr key={movement.id}>
                    <td>{formatDate(movement.date)}</td>
                    <td>
                      <span className={`caixinha-badge caixinha-badge--${movement.direction}`}>
                        {movement.direction === 'deposit' ? 'Depósito' : 'Retirada'}
                      </span>
                    </td>
                    <td title={movement.memo}>{movement.label}</td>
                    <td className={movement.direction === 'deposit' ? 'amount expense' : 'amount income'}>
                      {movement.direction === 'deposit' ? '-' : '+'}
                      {formatCurrency(movement.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsiblePanel>
    </section>
  );
}
