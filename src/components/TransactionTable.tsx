import { useMemo, useState } from 'react';
import type { Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/analytics';
import { CollapsiblePanel } from './CollapsiblePanel';

interface Props {
  transactions: Transaction[];
}

type TransactionFilter = 'all' | 'income' | 'expense';

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Todas' },
  { value: 'income' as const, label: 'Entradas' },
  { value: 'expense' as const, label: 'Saídas' },
];

export function TransactionTable({ transactions }: Props) {
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [search, setSearch] = useState('');

  const base = useMemo(() => transactions.filter((t) => !t.isInternal), [transactions]);

  const counts = useMemo(() => ({
    all: base.length,
    income: base.filter((t) => t.type === 'CREDIT').length,
    expense: base.filter((t) => t.type === 'DEBIT').length,
  }), [base]);

  const visible = useMemo(() => {
    return base
      .filter((t) => {
        if (filter === 'income') return t.type === 'CREDIT';
        if (filter === 'expense') return t.type === 'DEBIT';
        return true;
      })
      .filter((t) => {
        const query = search.toLowerCase();
        if (!query) return true;
        return (
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.memo.toLowerCase().includes(query)
        );
      });
  }, [base, filter, search]);

  const filterOptions = FILTER_OPTIONS.map((option) => ({
    ...option,
    label: `${option.label} (${counts[option.value]})`,
  }));

  return (
    <CollapsiblePanel
      title="Transações"
      subtitle="Movimentações reais da conta (sem caixinha e fatura)"
      count={visible.length}
      filter={filter}
      filterOptions={filterOptions}
      onFilterChange={setFilter}
      headerExtra={
        <input
          type="search"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          onClick={(e) => e.stopPropagation()}
        />
      }
    >
      {visible.length === 0 ? (
        <p className="empty-state empty-state--inline">Nenhuma transação para este filtro.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td title={transaction.memo}>{transaction.description}</td>
                  <td><span className="category-badge">{transaction.category}</span></td>
                  <td className={transaction.type === 'CREDIT' ? 'amount income' : 'amount expense'}>
                    {transaction.type === 'CREDIT' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CollapsiblePanel>
  );
}
