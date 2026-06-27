import type {
  AnalyticsResult,
  CategorySummary,
  Insight,
  MerchantSummary,
  MonthlyFlow,
  Transaction,
} from '../types';

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[Number(month) - 1]}/${year.slice(2)}`;
}

function getEffectiveTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => !t.isInternal);
}

export function buildAnalytics(transactions: Transaction[]): AnalyticsResult {
  const effective = getEffectiveTransactions(transactions);
  const incomeTx = effective.filter((t) => t.type === 'CREDIT');
  const expenseTx = effective.filter((t) => t.type === 'DEBIT');

  const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const dates = effective.map((t) => t.date.getTime());
  const start = dates.length ? new Date(Math.min(...dates)) : new Date();
  const end = dates.length ? new Date(Math.max(...dates)) : new Date();
  const daySpan = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const monthlyMap = new Map<string, MonthlyFlow>();

  for (const transaction of effective) {
    const key = formatMonthKey(transaction.date);
    const current = monthlyMap.get(key) ?? {
      month: key,
      label: formatMonthLabel(key),
      income: 0,
      expense: 0,
      balance: 0,
    };

    if (transaction.type === 'CREDIT') current.income += transaction.amount;
    else current.expense += transaction.amount;

    current.balance = current.income - current.expense;
    monthlyMap.set(key, current);
  }

  const monthlyFlow = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  const categoryMap = new Map<string, CategorySummary>();

  for (const transaction of expenseTx) {
    const current = categoryMap.get(transaction.category) ?? {
      category: transaction.category,
      total: 0,
      count: 0,
      percentage: 0,
    };
    current.total += transaction.amount;
    current.count += 1;
    categoryMap.set(transaction.category, current);
  }

  const categoryBreakdown = [...categoryMap.values()]
    .map((item) => ({
      ...item,
      percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const merchantMap = new Map<string, MerchantSummary>();

  for (const transaction of expenseTx) {
    const key = transaction.description.toLowerCase();
    const current = merchantMap.get(key) ?? {
      name: transaction.description,
      total: 0,
      count: 0,
      category: transaction.category,
    };
    current.total += transaction.amount;
    current.count += 1;
    merchantMap.set(key, current);
  }

  const topMerchants = [...merchantMap.values()].sort((a, b) => b.total - a.total).slice(0, 8);

  const insights = buildInsights({
    transactions: effective,
    totalIncome,
    totalExpense,
    netBalance,
    monthlyFlow,
    categoryBreakdown,
    topMerchants,
  });

  return {
    transactions,
    summary: {
      totalIncome,
      totalExpense,
      netBalance,
      transactionCount: effective.length,
      avgDailyExpense: totalExpense / daySpan,
      savingsRate: totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0,
    },
    monthlyFlow,
    categoryBreakdown,
    topMerchants,
    insights,
    dateRange: { start, end },
  };
}

function buildInsights(input: {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyFlow: MonthlyFlow[];
  categoryBreakdown: CategorySummary[];
  topMerchants: MerchantSummary[];
}): Insight[] {
  const insights: Insight[] = [];

  if (input.netBalance >= 0) {
    insights.push({
      type: 'success',
      title: 'Sobra positiva no fluxo',
      description: `Entradas superaram saídas reais em ${formatCurrency(input.netBalance)}. Isso é o fluxo da conta — o valor guardado na caixinha está na seção Caixinha/Reserva.`,
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Gastos acima das entradas',
      description: `No período analisado, as saídas superaram as entradas em ${formatCurrency(Math.abs(input.netBalance))}.`,
    });
  }

  const topCategory = input.categoryBreakdown[0];
  if (topCategory) {
    insights.push({
      type: 'info',
      title: `Maior categoria: ${topCategory.category}`,
      description: `${topCategory.percentage.toFixed(0)}% dos gastos (${formatCurrency(topCategory.total)} em ${topCategory.count} transações).`,
    });
  }

  const subscriptions = input.transactions.filter(
    (t) => t.type === 'DEBIT' && t.category === 'Assinaturas',
  );
  if (subscriptions.length > 0) {
    const total = subscriptions.reduce((sum, t) => sum + t.amount, 0);
    insights.push({
      type: 'info',
      title: 'Assinaturas detectadas',
      description: `${subscriptions.length} cobrança(s) recorrente(s) somando ${formatCurrency(total)} no período.`,
    });
  }

  const recurring = findRecurringMerchants(input.transactions);
  if (recurring.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Gastos repetidos',
      description: `${recurring.slice(0, 3).map((m) => m.name).join(', ')} aparecem várias vezes no extrato.`,
    });
  }

  if (input.monthlyFlow.length >= 2) {
    const last = input.monthlyFlow[input.monthlyFlow.length - 1];
    const previous = input.monthlyFlow[input.monthlyFlow.length - 2];
    const expenseDelta = ((last.expense - previous.expense) / Math.max(previous.expense, 1)) * 100;

    insights.push({
      type: expenseDelta > 10 ? 'warning' : 'success',
      title: 'Comparativo mensal',
      description:
        expenseDelta > 0
          ? `Gastos em ${last.label} ${expenseDelta > 0 ? 'subiram' : 'caíram'} ${Math.abs(expenseDelta).toFixed(0)}% vs ${previous.label}.`
          : `Gastos em ${last.label} estáveis em relação a ${previous.label}.`,
    });
  }

  const biggest = input.topMerchants[0];
  if (biggest) {
    insights.push({
      type: 'info',
      title: 'Maior destino de gasto',
      description: `${biggest.name}: ${formatCurrency(biggest.total)} (${biggest.count}x).`,
    });
  }

  return insights;
}

function findRecurringMerchants(transactions: Transaction[]): MerchantSummary[] {
  const map = new Map<string, MerchantSummary>();

  for (const transaction of transactions) {
    if (transaction.type !== 'DEBIT') continue;
    const key = transaction.description.toLowerCase();
    const current = map.get(key) ?? {
      name: transaction.description,
      total: 0,
      count: 0,
      category: transaction.category,
    };
    current.total += transaction.amount;
    current.count += 1;
    map.set(key, current);
  }

  return [...map.values()].filter((m) => m.count >= 3).sort((a, b) => b.count - a.count);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
