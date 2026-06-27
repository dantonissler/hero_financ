import { useMemo, useState } from 'react';
import type { Category, Transaction } from '../types';
import { ALL_CATEGORIES } from '../types';
import { formatCurrency, formatDate } from '../lib/analytics';
import { CollapsiblePanel } from './CollapsiblePanel';

interface Props {
  transactions: Transaction[];
  onCategoryChange: (transaction: Transaction, category: Category) => void;
}

type TransactionFilter = 'all' | 'income' | 'expense';

interface TableFilters {
  dateFrom: string;
  dateTo: string;
  description: string;
  category: Category | '';
}

const EMPTY_FILTERS: TableFilters = {
  dateFrom: '',
  dateTo: '',
  description: '',
  category: '',
};

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Todas' },
  { value: 'income' as const, label: 'Entradas' },
  { value: 'expense' as const, label: 'Saídas' },
];

function matchesDateFilter(date: Date, from: string, to: string): boolean {
  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (date < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59`);
    if (date > end) return false;
  }
  return true;
}

export function TransactionTable({ transactions, onCategoryChange }: Props) {
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [filters, setFilters] = useState<TableFilters>(EMPTY_FILTERS);

  const base = useMemo(() => transactions.filter((t) => !t.isInternal), [transactions]);

  const counts = useMemo(() => ({
    all: base.length,
    income: base.filter((t) => t.type === 'CREDIT').length,
    expense: base.filter((t) => t.type === 'DEBIT').length,
  }), [base]);

  const visible = useMemo(() => {
    const descriptionQuery = filters.description.trim().toLowerCase();

    return base
      .filter((t) => {
        if (filter === 'income') return t.type === 'CREDIT';
        if (filter === 'expense') return t.type === 'DEBIT';
        return true;
      })
      .filter((t) => matchesDateFilter(t.date, filters.dateFrom, filters.dateTo))
      .filter((t) => {
        if (!descriptionQuery) return true;
        return (
          t.description.toLowerCase().includes(descriptionQuery) ||
          t.memo.toLowerCase().includes(descriptionQuery)
        );
      })
      .filter((t) => !filters.category || t.category === filters.category);
  }, [base, filter, filters]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const transaction of visible) {
      if (transaction.type === 'CREDIT') income += transaction.amount;
      else expense += transaction.amount;
    }
    return { income, expense, net: income - expense };
  }, [visible]);

  const hasActiveFilters =
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.description.trim() !== '' ||
    filters.category !== '';

  const filterOptions = FILTER_OPTIONS.map((option) => ({
    ...option,
    label: `${option.label} (${counts[option.value]})`,
  }));

  function updateFilter<K extends keyof TableFilters>(key: K, value: TableFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <CollapsiblePanel
      title="Transações"
      subtitle="Reclassifique na tabela — a app aprende e aplica em transações parecidas"
      count={visible.length}
      filter={filter}
      filterOptions={filterOptions}
      onFilterChange={setFilter}
    >
      <div className="transaction-filters">
        <label className="transaction-filter-field">
          <span>Data de</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
            className="filter-input"
          />
        </label>
        <label className="transaction-filter-field">
          <span>Data até</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
            className="filter-input"
          />
        </label>
        <label className="transaction-filter-field transaction-filter-field--grow">
          <span>Descrição</span>
          <input
            type="search"
            placeholder="Buscar descrição..."
            value={filters.description}
            onChange={(event) => updateFilter('description', event.target.value)}
            className="filter-input"
          />
        </label>
        <label className="transaction-filter-field">
          <span>Categoria</span>
          <select
            value={filters.category}
            onChange={(event) => updateFilter('category', event.target.value as Category | '')}
            className="filter-input filter-select"
          >
            <option value="">Todas</option>
            {ALL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        {hasActiveFilters && (
          <button
            type="button"
            className="ghost-btn transaction-filter-clear"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="empty-state empty-state--inline">Nenhuma transação para este filtro.</p>
      ) : (
        <div className="table-wrap">
          <table className="transactions-table">
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
                  <td>
                    <select
                      className="category-select"
                      value={transaction.category}
                      onChange={(event) =>
                        onCategoryChange(transaction, event.target.value as Category)
                      }
                      aria-label={`Categoria de ${transaction.description}`}
                    >
                      {ALL_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={transaction.type === 'CREDIT' ? 'amount income' : 'amount expense'}>
                    {transaction.type === 'CREDIT' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>Total ({visible.length})</strong>
                </td>
                <td className="transaction-totals">
                  {totals.income > 0 && (
                    <div className="amount income">
                      <strong>+{formatCurrency(totals.income)}</strong>
                    </div>
                  )}
                  {totals.expense > 0 && (
                    <div className="amount expense">
                      <strong>-{formatCurrency(totals.expense)}</strong>
                    </div>
                  )}
                  {filter === 'all' && totals.income > 0 && totals.expense > 0 && (
                    <div className={`transaction-total-net amount ${totals.net >= 0 ? 'income' : 'expense'}`}>
                      Líquido: {totals.net >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(totals.net))}
                    </div>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </CollapsiblePanel>
  );
}
