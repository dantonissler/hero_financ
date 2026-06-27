import type { TransactionType } from '../types';

export type CaixinhaDirection = 'deposit' | 'withdrawal';

export interface CaixinhaInfo {
  direction: CaixinhaDirection;
  label: string;
}

const DEPOSIT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^aplicação rdb$/i, label: 'Aplicação RDB' },
  { pattern: /^dinheiro guardado/i, label: 'Reserva planejada' },
  { pattern: /^transferência para a caixinha/i, label: 'Transferência para caixinha' },
];

const WITHDRAWAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^resgate rdb$/i, label: 'Resgate RDB' },
  { pattern: /^resgate da caixinha/i, label: 'Resgate da caixinha' },
];

export function getCaixinhaInfo(memo: string, type: TransactionType): CaixinhaInfo | null {
  const trimmed = memo.trim();

  for (const { pattern, label } of DEPOSIT_PATTERNS) {
    if (pattern.test(trimmed) && type === 'DEBIT') {
      return { direction: 'deposit', label };
    }
  }

  for (const { pattern, label } of WITHDRAWAL_PATTERNS) {
    if (pattern.test(trimmed) && type === 'CREDIT') {
      return { direction: 'withdrawal', label };
    }
  }

  return null;
}

export function isCaixinhaTransaction(memo: string, type: TransactionType): boolean {
  return getCaixinhaInfo(memo, type) !== null;
}
