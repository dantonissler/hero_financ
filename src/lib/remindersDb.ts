import type { ExpenseReminder, MonthBudgetSummary, ReminderStatus } from '../types';

export type HistoryAction = 'create' | 'update' | 'delete' | 'import' | 'reset';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: HistoryAction;
  reminderId?: string;
  monthKey?: string;
  field?: keyof ExpenseReminder | keyof MonthBudgetSummary;
  oldValue?: string | number;
  newValue?: string | number;
  description: string;
}

export interface MonthRecord {
  monthKey: string;
  monthLabel: string;
}

export interface RemindersDatabase {
  version: number;
  updatedAt: string;
  months: MonthRecord[];
  reminders: ExpenseReminder[];
  history: HistoryEntry[];
}

const STORAGE_KEY = 'finance-dashboard-reminders-db';
const SEED_URL = '/data/reminders-seed.json';
const DB_VERSION = 2;

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function monthLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const index = Number(month) - 1;
  if (index < 0 || index > 11) return monthKey;
  return `${MONTH_NAMES[index]} ${year}`;
}

export function getCurrentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getNextMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);
  return getCurrentMonthKey(date);
}

export function monthExists(db: RemindersDatabase, monthKey: string): boolean {
  return db.months.some((month) => month.monthKey === monthKey);
}

function appendHistory(
  db: RemindersDatabase,
  entry: Omit<HistoryEntry, 'id' | 'timestamp'>,
): RemindersDatabase {
  const historyEntry: HistoryEntry = {
    id: createId('hist'),
    timestamp: nowIso(),
    ...entry,
  };

  return {
    ...db,
    updatedAt: nowIso(),
    history: [historyEntry, ...db.history].slice(0, 200),
  };
}

function migrateReminder(raw: Record<string, unknown>): ExpenseReminder {
  return {
    id: String(raw.id),
    monthKey: String(raw.monthKey),
    monthLabel: String(raw.monthLabel),
    descricao: String(raw.descricao ?? ''),
    valor: Number(raw.valor ?? 0),
    status: (raw.status === 'paid' ? 'paid' : 'unpaid') as ReminderStatus,
    parcela: String(raw.parcela ?? ''),
    link: String(raw.link ?? ''),
    observacao: String(raw.observacao ?? ''),
  };
}

export function migrateDatabase(raw: unknown): RemindersDatabase {
  const data = raw as Partial<RemindersDatabase> & { reminders?: Record<string, unknown>[]; months?: Record<string, unknown>[] };
  const months = (data.months ?? []).map((month) => ({
    monthKey: String(month.monthKey),
    monthLabel: String(month.monthLabel ?? monthLabelFromKey(String(month.monthKey))),
  }));

  return {
    version: DB_VERSION,
    updatedAt: data.updatedAt ?? nowIso(),
    months,
    reminders: (data.reminders ?? []).map((item) => migrateReminder(item as unknown as Record<string, unknown>)),
    history: data.history ?? [],
  };
}

export function computeMonthSummary(monthKey: string, reminders: ExpenseReminder[]): MonthBudgetSummary {
  const monthReminders = reminders.filter((item) => item.monthKey === monthKey);
  const total = monthReminders.reduce((sum, item) => sum + item.valor, 0);
  const pago = monthReminders
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + item.valor, 0);
  const faltaPagar = monthReminders
    .filter((item) => item.status === 'unpaid')
    .reduce((sum, item) => sum + item.valor, 0);

  return {
    monthKey,
    monthLabel: monthLabelFromKey(monthKey),
    total,
    pago,
    faltaPagar,
  };
}

export function buildWorkbookView(db: RemindersDatabase) {
  const months = [...db.months]
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((month) => computeMonthSummary(month.monthKey, db.reminders));

  return { months, reminders: db.reminders };
}

function persist(db: RemindersDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function saveDatabase(db: RemindersDatabase): RemindersDatabase {
  const next = { ...db, updatedAt: nowIso(), version: DB_VERSION };
  persist(next);
  return next;
}

export async function loadDatabase(): Promise<RemindersDatabase> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return migrateDatabase(JSON.parse(stored));
  }

  const response = await fetch(SEED_URL);
  if (!response.ok) {
    throw new Error('Seed de lembretes não encontrado');
  }

  const seed = migrateDatabase(await response.json());
  persist(seed);
  return seed;
}

export function resetDatabase(seed: RemindersDatabase): RemindersDatabase {
  const migrated = migrateDatabase(seed);
  const next = appendHistory(
    { ...migrated, updatedAt: nowIso() },
    { action: 'reset', description: 'Banco resetado para o seed inicial' },
  );
  persist(next);
  return next;
}

export function importDatabase(raw: RemindersDatabase): RemindersDatabase {
  const migrated = migrateDatabase(raw);
  const next = appendHistory(
    { ...migrated, updatedAt: nowIso() },
    { action: 'import', description: 'Banco importado de arquivo JSON' },
  );
  persist(next);
  return next;
}

export function addMonth(db: RemindersDatabase, monthKey: string): RemindersDatabase {
  if (monthExists(db, monthKey)) return db;

  const next = appendHistory(
    {
      ...db,
      months: [...db.months, { monthKey, monthLabel: monthLabelFromKey(monthKey) }].sort(
        (a, b) => a.monthKey.localeCompare(b.monthKey),
      ),
    },
    { action: 'create', monthKey, description: `Mês ${monthLabelFromKey(monthKey)} criado` },
  );

  persist(next);
  return next;
}

export function createMonth(
  db: RemindersDatabase,
  monthKey: string,
  options?: { copyFrom?: string },
): { db: RemindersDatabase; created: boolean } {
  if (monthExists(db, monthKey)) {
    return { db, created: false };
  }

  let next = addMonth(db, monthKey);

  if (options?.copyFrom && options.copyFrom !== monthKey) {
    next = duplicateMonthReminders(next, options.copyFrom, monthKey);
  }

  return { db: next, created: true };
}

export function createReminder(db: RemindersDatabase, monthKey: string): RemindersDatabase {
  let base = db;
  if (!db.months.some((month) => month.monthKey === monthKey)) {
    base = addMonth(db, monthKey);
  }

  const monthLabel = monthLabelFromKey(monthKey);
  const reminder: ExpenseReminder = {
    id: createId('rem'),
    monthKey,
    monthLabel,
    valor: 0,
    status: 'unpaid',
    parcela: '',
    descricao: '',
    link: '',
    observacao: '',
  };

  const next = appendHistory(
    { ...base, reminders: [...base.reminders, reminder] },
    {
      action: 'create',
      reminderId: reminder.id,
      monthKey,
      description: `Nova linha em ${monthLabel}`,
    },
  );

  persist(next);
  return next;
}

export function duplicateMonthReminders(
  db: RemindersDatabase,
  fromMonthKey: string,
  toMonthKey: string,
): RemindersDatabase {
  const source = db.reminders.filter((item) => item.monthKey === fromMonthKey);
  const monthLabel = monthLabelFromKey(toMonthKey);
  const copies = source.map((item) => ({
    ...item,
    id: createId('rem'),
    monthKey: toMonthKey,
    monthLabel,
    status: 'unpaid' as ReminderStatus,
  }));

  let next: RemindersDatabase = { ...db, reminders: [...db.reminders, ...copies] };
  if (!db.months.some((month) => month.monthKey === toMonthKey)) {
    next = addMonth(next, toMonthKey);
  }

  next = appendHistory(next, {
    action: 'create',
    monthKey: toMonthKey,
    description: `${copies.length} lembrete(s) copiado(s) de ${monthLabelFromKey(fromMonthKey)}`,
  });

  persist(next);
  return next;
}

export function updateReminderField<K extends keyof ExpenseReminder>(
  db: RemindersDatabase,
  reminderId: string,
  field: K,
  value: ExpenseReminder[K],
): RemindersDatabase {
  const current = db.reminders.find((item) => item.id === reminderId);
  if (!current) return db;

  const next = appendHistory(
    {
      ...db,
      reminders: db.reminders.map((item) =>
        item.id === reminderId ? { ...item, [field]: value } : item,
      ),
    },
    {
      action: 'update',
      reminderId,
      monthKey: current.monthKey,
      field,
      oldValue: String(current[field] ?? ''),
      newValue: String(value ?? ''),
      description: `${String(field)} atualizado em "${current.descricao || 'sem descrição'}"`,
    },
  );

  persist(next);
  return next;
}

export function deleteReminder(db: RemindersDatabase, reminderId: string): RemindersDatabase {
  const current = db.reminders.find((item) => item.id === reminderId);
  if (!current) return db;

  const next = appendHistory(
    { ...db, reminders: db.reminders.filter((item) => item.id !== reminderId) },
    {
      action: 'delete',
      reminderId,
      monthKey: current.monthKey,
      description: `Linha removida: ${current.descricao || reminderId}`,
    },
  );

  persist(next);
  return next;
}

export function exportDatabase(db: RemindersDatabase): string {
  return JSON.stringify(db, null, 2);
}
