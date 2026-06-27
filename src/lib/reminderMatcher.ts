import type { ExpenseReminder, ReminderMatch, Transaction } from '../types';

const MATCH_RULES: Array<{ keywords: string[]; patterns: RegExp[] }> = [
  { keywords: ['net'], patterns: [/netmaxxi/i, /\bnet\b/i] },
  { keywords: ['condominio', 'condomínio'], patterns: [/condomínio/i, /condominio/i, /dinamica/i] },
  { keywords: ['contabilizei'], patterns: [/contabilizei/i] },
  { keywords: ['energia'], patterns: [/energisa/i, /energia/i] },
  { keywords: ['e solar', 'solar'], patterns: [/sonora energia/i, /solar/i] },
  { keywords: ['financiamento carro'], patterns: [/votorantim/i, /financiamento.*carro/i] },
  { keywords: ['financiamento casa'], patterns: [/bradesco est unif/i, /financiamento.*casa/i] },
  { keywords: ['cartão bradesco', 'cartao bradesco'], patterns: [/bradesco/i] },
  { keywords: ['cartão de credito nubank', 'cartao de credito nubank'], patterns: [/pagamento de fatura/i] },
  { keywords: ['iptu'], patterns: [/iptu/i, /pref mun/i] },
  { keywords: ['das simples'], patterns: [/das/i, /simples/i] },
  { keywords: ['darf'], patterns: [/darf/i] },
  { keywords: ['plano de saude', 'plano de saúde'], patterns: [/plano.*sa[uú]de/i, /unimed/i, /amil/i] },
  { keywords: ['faculdade'], patterns: [/faculdade/i, /estácio/i, /estacio/i] },
  { keywords: ['claro'], patterns: [/claro/i] },
  { keywords: ['ipva'], patterns: [/ipva/i, /detran/i] },
  { keywords: ['mercado'], patterns: [/mercado/i, /atacad/i, /comper/i] },
  { keywords: ['multa'], patterns: [/multa/i] },
  { keywords: ['fone'], patterns: [/fone/i, /telefone/i] },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function amountMatches(expected: number, actual: number): boolean {
  return Math.abs(expected - actual) < 0.02;
}

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function findPatterns(description: string): RegExp[] {
  const normalized = normalizeText(description);

  for (const rule of MATCH_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return rule.patterns;
    }
  }

  const words = normalized.split(/\s+/).filter((word) => word.length >= 4);
  if (words.length === 0) return [];
  return [new RegExp(words.slice(0, 2).join('.*'), 'i')];
}

export function matchRemindersWithTransactions(
  reminders: ExpenseReminder[],
  transactions: Transaction[],
): ReminderMatch[] {
  const matches: ReminderMatch[] = [];
  const usedTransactions = new Set<string>();

  const realTransactions = transactions.filter((transaction) => !transaction.isInternal);

  for (const reminder of reminders) {
    if (reminder.status === 'paid') continue;

    const patterns = findPatterns(reminder.descricao);
    if (patterns.length === 0) continue;

    const monthTransactions = realTransactions.filter(
      (transaction) =>
        monthKeyFromDate(transaction.date) === reminder.monthKey &&
        transaction.type === 'DEBIT',
    );

    for (const transaction of monthTransactions) {
      if (usedTransactions.has(transaction.id)) continue;

      const haystack = `${transaction.description} ${transaction.memo}`;
      const patternHit = patterns.some((pattern) => pattern.test(haystack));
      if (!patternHit) continue;

      const confidence: 'high' | 'medium' = amountMatches(reminder.valor, transaction.amount)
        ? 'high'
        : 'medium';

      matches.push({
        reminderId: reminder.id,
        transactionId: transaction.id,
        transactionDescription: transaction.description,
        transactionDate: transaction.date,
        transactionAmount: transaction.amount,
        confidence,
      });
      usedTransactions.add(transaction.id);
      break;
    }
  }

  return matches;
}
