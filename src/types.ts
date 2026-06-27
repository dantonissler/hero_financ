export type TransactionType = 'CREDIT' | 'DEBIT';

export type Category =
  | 'Salário e receitas'
  | 'Alimentação'
  | 'Mercado'
  | 'Transporte'
  | 'Moradia'
  | 'Contas e serviços'
  | 'Imposto'
  | 'Assinaturas'
  | 'Saúde'
  | 'Compras'
  | 'Lazer'
  | 'Cartão de crédito'
  | 'Investimentos'
  | 'Transferências'
  | 'Outros';

export const ALL_CATEGORIES: Category[] = [
  'Salário e receitas',
  'Alimentação',
  'Mercado',
  'Transporte',
  'Moradia',
  'Contas e serviços',
  'Imposto',
  'Assinaturas',
  'Saúde',
  'Compras',
  'Lazer',
  'Cartão de crédito',
  'Investimentos',
  'Transferências',
  'Outros',
];

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: TransactionType;
  memo: string;
  description: string;
  category: Category;
  isInternal: boolean;
}

export interface MonthlyFlow {
  month: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface MerchantSummary {
  name: string;
  total: number;
  count: number;
  category: Category;
}

export interface Insight {
  type: 'info' | 'warning' | 'success';
  title: string;
  description: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  avgDailyExpense: number;
  savingsRate: number;
}

export interface AnalyticsResult {
  transactions: Transaction[];
  summary: DashboardSummary;
  monthlyFlow: MonthlyFlow[];
  categoryBreakdown: CategorySummary[];
  topMerchants: MerchantSummary[];
  insights: Insight[];
  dateRange: { start: Date; end: Date };
}

export type ReminderStatus = 'paid' | 'unpaid';

export interface ExpenseReminder {
  id: string;
  monthKey: string;
  monthLabel: string;
  descricao: string;
  valor: number;
  status: ReminderStatus;
  parcela: string;
  link: string;
  observacao: string;
}

export interface MonthBudgetSummary {
  monthKey: string;
  monthLabel: string;
  total: number;
  pago: number;
  faltaPagar: number;
}

export interface RemindersWorkbook {
  months: MonthBudgetSummary[];
  reminders: ExpenseReminder[];
}

export interface ReminderMatch {
  reminderId: string;
  transactionId: string;
  transactionDescription: string;
  transactionDate: Date;
  transactionAmount: number;
  confidence: 'high' | 'medium';
}

export type AppTab = 'extrato' | 'lembretes';
