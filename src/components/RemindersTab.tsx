import { useMemo, useRef, useState } from 'react';
import type { ReminderMatch, Transaction } from '../types';
import { formatCurrency } from '../lib/analytics';
import { buildWorkbookView, computeMonthSummary, exportDatabase, monthLabelFromKey } from '../lib/remindersDb';
import type { RemindersDatabase } from '../lib/remindersDb';
import { matchRemindersWithTransactions } from '../lib/reminderMatcher';
import { useRemindersDb } from '../hooks/useRemindersDb';
import { AddMonthPanel } from './AddMonthPanel';
import { CollapsiblePanel } from './CollapsiblePanel';
import {
  ReminderBoardView,
  ReminderCardsView,
  ReminderTableView,
  type ReminderViewMode,
} from './RemindersViews';

interface Props {
  transactions: Transaction[];
}

type ReminderFilter = 'all' | 'paid' | 'unpaid';

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'unpaid' as const, label: 'A pagar' },
  { value: 'paid' as const, label: 'Pagos' },
];

const VIEW_OPTIONS: Array<{ value: ReminderViewMode; label: string }> = [
  { value: 'tabela', label: 'Tabela' },
  { value: 'cards', label: 'Cards' },
  { value: 'quadros', label: 'Quadros' },
];

export function RemindersTab({ transactions }: Props) {
  const {
    db,
    loading,
    error,
    createMonth,
    createReminder,
    duplicateMonthReminders,
    updateReminder,
    deleteReminder,
    importDb,
    resetDb,
  } = useRemindersDb();

  const importRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [filter, setFilter] = useState<ReminderFilter>('all');
  const [viewMode, setViewMode] = useState<ReminderViewMode>('tabela');
  const [search, setSearch] = useState('');

  const workbook = useMemo(() => (db ? buildWorkbookView(db) : null), [db]);

  const matches = useMemo(
    () => (db ? matchRemindersWithTransactions(db.reminders, transactions) : []),
    [db, transactions],
  );

  const activeMonth = selectedMonth || workbook?.months[workbook.months.length - 1]?.monthKey || '';

  const monthSummary = useMemo(
    () => (activeMonth && db ? computeMonthSummary(activeMonth, db.reminders) : null),
    [activeMonth, db],
  );

  const monthReminders = useMemo(() => {
    if (!db) return [];
    return db.reminders.filter((reminder) => reminder.monthKey === activeMonth);
  }, [db, activeMonth]);

  const counts = useMemo(() => ({
    all: monthReminders.length,
    paid: monthReminders.filter((item) => item.status === 'paid').length,
    unpaid: monthReminders.filter((item) => item.status === 'unpaid').length,
  }), [monthReminders]);

  const visible = useMemo(() => {
    return monthReminders.filter((reminder) => {
      if (filter === 'paid' && reminder.status !== 'paid') return false;
      if (filter === 'unpaid' && reminder.status !== 'unpaid') return false;

      const query = search.toLowerCase();
      if (!query) return true;

      return (
        reminder.descricao.toLowerCase().includes(query) ||
        reminder.observacao.toLowerCase().includes(query) ||
        reminder.link.toLowerCase().includes(query)
      );
    });
  }, [monthReminders, filter, search]);

  const filterOptions = FILTER_OPTIONS.map((option) => ({
    ...option,
    label: `${option.label} (${counts[option.value]})`,
  }));

  const previousMonth = useMemo(() => {
    if (!workbook || !activeMonth) return null;
    const index = workbook.months.findIndex((month) => month.monthKey === activeMonth);
    return index > 0 ? workbook.months[index - 1].monthKey : null;
  }, [workbook, activeMonth]);

  function handleExport() {
    if (!db) return;
    const blob = new Blob([exportDatabase(db)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lembretes-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const text = await file.text();
    importDb(JSON.parse(text) as RemindersDatabase);
  }

  function handleCreateMonth(monthKey: string, copyFrom?: string): boolean {
    const created = createMonth(monthKey, copyFrom ? { copyFrom } : undefined);
    if (created) setSelectedMonth(monthKey);
    return created;
  }

  return (
    <div className="reminders-tab">
      <header className="reminders-hero">
        <div>
          <h2>Lembretes de gastos</h2>
          <p>Edite, adicione e remova linhas. Tudo fica salvo no navegador com histórico de alterações.</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="ghost-btn" onClick={handleExport} disabled={!db}>Exportar JSON</button>
          <button type="button" className="ghost-btn" onClick={() => importRef.current?.click()} disabled={loading}>Importar JSON</button>
          <button type="button" className="ghost-btn" onClick={() => void resetDb()} disabled={loading}>Resetar seed</button>
          <input ref={importRef} type="file" accept=".json" hidden onChange={(e) => void handleImport(e.target.files)} />
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p className="loading-state">Carregando lembretes...</p>}

      {db && workbook && (
        <>
          <div className="month-toolbar">
            <div className="month-chips">
              {workbook.months.length === 0 && (
                <span className="empty-state empty-state--inline">Nenhum mês ainda. Crie o primeiro abaixo.</span>
              )}
              {workbook.months.map((month) => (
                <button
                  key={month.monthKey}
                  type="button"
                  className={activeMonth === month.monthKey ? 'month-chip active' : 'month-chip'}
                  onClick={() => setSelectedMonth(month.monthKey)}
                >
                  {month.monthLabel}
                </button>
              ))}
            </div>
          </div>

          <AddMonthPanel
            activeMonth={activeMonth}
            existingMonths={workbook.months.map((month) => month.monthKey)}
            onCreate={handleCreateMonth}
          />

          {monthSummary && (
            <MonthSummaryCards summary={monthSummary} reminders={monthReminders} matches={matches} />
          )}

          <div className="reminders-toolbar">
            {activeMonth ? (
              <>
                <button type="button" className="primary-btn" onClick={() => createReminder(activeMonth)}>
                  + Nova linha
                </button>
                {previousMonth && (
                  <button
                    type="button"
                    className="ghost-btn ghost-btn--small"
                    onClick={() => duplicateMonthReminders(previousMonth, activeMonth)}
                  >
                    Copiar de {monthLabelFromKey(previousMonth)}
                  </button>
                )}
                <div className="view-mode-group">
                  {VIEW_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={viewMode === option.value ? 'filter-btn active' : 'filter-btn'}
                      onClick={() => setViewMode(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="empty-state empty-state--inline">Selecione ou crie um mês para adicionar lembretes.</p>
            )}
          </div>

          {activeMonth && (
            <CollapsiblePanel
              title={`Lembretes — ${monthLabelFromKey(activeMonth)}`}
              subtitle={`Visualização: ${VIEW_OPTIONS.find((v) => v.value === viewMode)?.label}`}
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
                />
              }
            >
              {visible.length === 0 ? (
                <p className="empty-state empty-state--inline">
                  Nenhum lembrete. Clique em &quot;+ Nova linha&quot; para adicionar.
                </p>
              ) : viewMode === 'tabela' ? (
                <ReminderTableView
                  reminders={visible}
                  onUpdate={updateReminder}
                  onDelete={deleteReminder}
                />
              ) : viewMode === 'cards' ? (
                <ReminderCardsView
                  reminders={visible}
                  onUpdate={updateReminder}
                  onDelete={deleteReminder}
                />
              ) : (
                <ReminderBoardView
                  reminders={visible}
                  onUpdate={updateReminder}
                  onDelete={deleteReminder}
                />
              )}
            </CollapsiblePanel>
          )}

          <CollapsiblePanel
            title="Histórico de alterações"
            subtitle="Últimas 200 mudanças salvas localmente"
            count={db.history.length}
            defaultOpen={false}
          >
            {db.history.length === 0 ? (
              <p className="empty-state empty-state--inline">Nenhuma alteração registrada ainda.</p>
            ) : (
              <ul className="history-list">
                {db.history.map((entry) => (
                  <li key={entry.id} className="history-item">
                    <time>{new Date(entry.timestamp).toLocaleString('pt-BR')}</time>
                    <span className={`history-action history-action--${entry.action}`}>{entry.action}</span>
                    <p>{entry.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </CollapsiblePanel>
        </>
      )}
    </div>
  );
}

function MonthSummaryCards({
  summary,
  reminders,
  matches,
}: {
  summary: ReturnType<typeof computeMonthSummary>;
  reminders: import('../types').ExpenseReminder[];
  matches: ReminderMatch[];
}) {
  const unpaid = reminders.filter((item) => item.status === 'unpaid');
  const detectedCount = matches.filter((match) =>
    reminders.some((reminder) => reminder.id === match.reminderId),
  ).length;

  return (
    <div className="summary-grid reminders-summary-grid">
      <article className="summary-card">
        <span className="summary-label">Total previsto</span>
        <strong className="summary-value">{formatCurrency(summary.total)}</strong>
      </article>
      <article className="summary-card" style={{ borderColor: 'var(--green)' }}>
        <span className="summary-label">Já pago</span>
        <strong className="summary-value" style={{ color: 'var(--green)' }}>{formatCurrency(summary.pago)}</strong>
      </article>
      <article className="summary-card" style={{ borderColor: 'var(--red)' }}>
        <span className="summary-label">Falta pagar</span>
        <strong className="summary-value" style={{ color: 'var(--red)' }}>{formatCurrency(summary.faltaPagar)}</strong>
      </article>
      <article className="summary-card">
        <span className="summary-label">Detectado no extrato</span>
        <strong className="summary-value">{detectedCount} de {unpaid.length}</strong>
      </article>
    </div>
  );
}
