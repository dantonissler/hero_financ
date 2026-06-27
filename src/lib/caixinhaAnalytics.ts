import type { Transaction } from '../types';
import { getCaixinhaInfo } from './caixinha';

export interface CaixinhaMovement {
  id: string;
  date: Date;
  amount: number;
  direction: 'deposit' | 'withdrawal';
  label: string;
  memo: string;
}

export interface CaixinhaSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  netInPeriod: number;
  estimatedBalance: number;
  avgDailyBalance: number;
  avgDeposit: number;
  depositCount: number;
  withdrawalCount: number;
  movements: CaixinhaMovement[];
}

function toDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function extractMovements(transactions: Transaction[]): CaixinhaMovement[] {
  return transactions
    .map((transaction) => {
      const info = getCaixinhaInfo(transaction.memo, transaction.type);
      if (!info) return null;

      return {
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        direction: info.direction,
        label: info.label,
        memo: transaction.memo,
      };
    })
    .filter((item): item is CaixinhaMovement => item !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function computeBalanceAt(movements: CaixinhaMovement[], beforeDate: Date): number {
  const cutoff = beforeDate.getTime();
  let balance = 0;

  for (const movement of movements) {
    if (movement.date.getTime() >= cutoff) break;
    if (movement.direction === 'deposit') balance += movement.amount;
    else balance -= movement.amount;
  }

  return balance;
}

function computeEstimatedBalance(movements: CaixinhaMovement[]): number {
  return movements.reduce((balance, movement) => {
    if (movement.direction === 'deposit') return balance + movement.amount;
    return balance - movement.amount;
  }, 0);
}

function computeAvgDailyBalance(
  allMovements: CaixinhaMovement[],
  periodStart: Date,
  periodEnd: Date,
): number {
  if (allMovements.length === 0) return 0;

  const start = toDayStart(periodStart);
  const end = toDayStart(periodEnd);
  if (start > end) return 0;

  let balance = computeBalanceAt(allMovements, start);
  let movementIndex = 0;

  while (movementIndex < allMovements.length && toDayStart(allMovements[movementIndex].date) < start) {
    movementIndex += 1;
  }

  let totalBalance = 0;
  let dayCount = 0;
  let cursor = start;

  while (cursor <= end) {
    const nextDay = addDays(cursor, 1);

    while (
      movementIndex < allMovements.length &&
      toDayStart(allMovements[movementIndex].date).getTime() === cursor.getTime()
    ) {
      const movement = allMovements[movementIndex];
      if (movement.direction === 'deposit') balance += movement.amount;
      else balance -= movement.amount;
      movementIndex += 1;
    }

    totalBalance += balance;
    dayCount += 1;
    cursor = nextDay;
  }

  return dayCount > 0 ? totalBalance / dayCount : balance;
}

export function buildCaixinhaSummary(
  allTransactions: Transaction[],
  periodTransactions: Transaction[],
): CaixinhaSummary | null {
  const allMovements = extractMovements(allTransactions);
  if (allMovements.length === 0) return null;

  const periodMovements = extractMovements(periodTransactions);
  const deposits = periodMovements.filter((m) => m.direction === 'deposit');
  const withdrawals = periodMovements.filter((m) => m.direction === 'withdrawal');

  const totalDeposits = deposits.reduce((sum, m) => sum + m.amount, 0);
  const totalWithdrawals = withdrawals.reduce((sum, m) => sum + m.amount, 0);

  const periodDates = periodTransactions.map((t) => t.date.getTime());
  const periodStart = new Date(Math.min(...periodDates));
  const periodEnd = new Date(Math.max(...periodDates));

  return {
    totalDeposits,
    totalWithdrawals,
    netInPeriod: totalDeposits - totalWithdrawals,
    estimatedBalance: computeEstimatedBalance(allMovements),
    avgDailyBalance: computeAvgDailyBalance(allMovements, periodStart, periodEnd),
    avgDeposit: deposits.length > 0 ? totalDeposits / deposits.length : 0,
    depositCount: deposits.length,
    withdrawalCount: withdrawals.length,
    movements: [...periodMovements].sort((a, b) => b.date.getTime() - a.date.getTime()),
  };
}
