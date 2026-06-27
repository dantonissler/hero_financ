import type { Transaction } from '../types';

export type DateFilterMode = 'all' | 'month' | 'range';

export interface DateFilterValue {
  mode: DateFilterMode;
  month?: string;
  startDate?: string;
  endDate?: string;
}

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_LABELS[Number(month) - 1]} ${year}`;
}

export function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  for (const transaction of transactions) {
    months.add(formatMonthKey(transaction.date));
  }
  return [...months].sort();
}

function toDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseInputDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function filterTransactionsByDate(
  transactions: Transaction[],
  filter: DateFilterValue,
): Transaction[] {
  if (filter.mode === 'all') return transactions;

  if (filter.mode === 'month' && filter.month) {
    return transactions.filter((t) => formatMonthKey(t.date) === filter.month);
  }

  if (filter.mode === 'range') {
    const start = filter.startDate ? parseInputDate(filter.startDate) : null;
    const end = filter.endDate ? parseInputDate(filter.endDate) : null;

    return transactions.filter((t) => {
      const day = toDayStart(t.date);
      if (start && day < toDayStart(start)) return false;
      if (end && day > toDayStart(end)) return false;
      return true;
    });
  }

  return transactions;
}

export function getDateBounds(transactions: Transaction[]): { min: string; max: string } | null {
  if (transactions.length === 0) return null;

  const times = transactions.map((t) => t.date.getTime());
  const min = new Date(Math.min(...times));
  const max = new Date(Math.max(...times));

  const toInput = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return { min: toInput(min), max: toInput(max) };
}

export const DEFAULT_DATE_FILTER: DateFilterValue = { mode: 'all' };
