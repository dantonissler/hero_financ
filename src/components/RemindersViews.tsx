import type { ExpenseReminder } from '../types';
import { formatCurrency } from '../lib/analytics';

export type ReminderViewMode = 'tabela' | 'cards' | 'quadros';

interface RowProps {
  reminder: ExpenseReminder;
  onUpdate: <K extends keyof ExpenseReminder>(id: string, field: K, value: ExpenseReminder[K]) => void;
  onDelete: (id: string) => void;
}

export function ReminderTableView({ reminders, onUpdate, onDelete }: {
  reminders: ExpenseReminder[];
  onUpdate: RowProps['onUpdate'];
  onDelete: RowProps['onDelete'];
}) {
  return (
    <div className="table-wrap">
      <table className="editable-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Parcela</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Link</th>
            <th>Obs.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reminders.map((reminder) => (
            <ReminderTableRow
              key={reminder.id}
              reminder={reminder}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReminderCardsView({ reminders, onUpdate, onDelete }: {
  reminders: ExpenseReminder[];
  onUpdate: RowProps['onUpdate'];
  onDelete: RowProps['onDelete'];
}) {
  return (
    <div className="reminder-cards-grid">
      {reminders.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function ReminderBoardView({ reminders, onUpdate, onDelete }: {
  reminders: ExpenseReminder[];
  onUpdate: RowProps['onUpdate'];
  onDelete: RowProps['onDelete'];
}) {
  const unpaid = reminders.filter((item) => item.status === 'unpaid');
  const paid = reminders.filter((item) => item.status === 'paid');

  return (
    <div className="reminder-board">
      <BoardColumn
        title="A pagar"
        total={unpaid.reduce((sum, item) => sum + item.valor, 0)}
        reminders={unpaid}
        onUpdate={onUpdate}
        onDelete={onDelete}
        accent="var(--red)"
      />
      <BoardColumn
        title="Pagos"
        total={paid.reduce((sum, item) => sum + item.valor, 0)}
        reminders={paid}
        onUpdate={onUpdate}
        onDelete={onDelete}
        accent="var(--green)"
      />
    </div>
  );
}

function BoardColumn({
  title,
  total,
  reminders,
  onUpdate,
  onDelete,
  accent,
}: {
  title: string;
  total: number;
  reminders: ExpenseReminder[];
  onUpdate: RowProps['onUpdate'];
  onDelete: RowProps['onDelete'];
  accent: string;
}) {
  return (
    <section className="board-column" style={{ borderTopColor: accent }}>
      <header className="board-column-header">
        <h4>{title}</h4>
        <span>{reminders.length} · {formatCurrency(total)}</span>
      </header>
      <div className="board-column-list">
        {reminders.length === 0 ? (
          <p className="empty-state empty-state--inline">Nenhum item</p>
        ) : (
          reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onUpdate={onUpdate}
              onDelete={onDelete}
              compact
            />
          ))
        )}
      </div>
    </section>
  );
}

function ReminderTableRow({ reminder, onUpdate, onDelete }: RowProps) {
  return (
    <tr>
      <td>
        <input
          className="cell-input"
          value={reminder.descricao}
          onChange={(e) => onUpdate(reminder.id, 'descricao', e.target.value)}
          placeholder="Descrição"
        />
      </td>
      <td>
        <input
          className="cell-input cell-input--narrow"
          value={reminder.parcela}
          onChange={(e) => onUpdate(reminder.id, 'parcela', e.target.value)}
          placeholder="1/12"
        />
      </td>
      <td>
        <input
          type="number"
          className="cell-input cell-input--narrow"
          value={reminder.valor || ''}
          onChange={(e) => onUpdate(reminder.id, 'valor', Number(e.target.value) || 0)}
          step="0.01"
          min="0"
        />
      </td>
      <td>
        <select
          className="cell-input"
          value={reminder.status}
          onChange={(e) => onUpdate(reminder.id, 'status', e.target.value as ExpenseReminder['status'])}
        >
          <option value="unpaid">A pagar</option>
          <option value="paid">Pago</option>
        </select>
      </td>
      <td><LinkField reminder={reminder} onUpdate={onUpdate} /></td>
      <td>
        <input
          className="cell-input"
          value={reminder.observacao}
          onChange={(e) => onUpdate(reminder.id, 'observacao', e.target.value)}
          placeholder="Obs."
        />
      </td>
      <td>
        <button type="button" className="row-delete-btn" onClick={() => onDelete(reminder.id)} title="Remover">
          ✕
        </button>
      </td>
    </tr>
  );
}

function ReminderCard({ reminder, onUpdate, onDelete, compact = false }: RowProps & { compact?: boolean }) {
  return (
    <article className={`reminder-card reminder-card--${reminder.status}${compact ? ' reminder-card--compact' : ''}`}>
      <div className="reminder-card-header">
        <input
          className="cell-input cell-input--title"
          value={reminder.descricao}
          onChange={(e) => onUpdate(reminder.id, 'descricao', e.target.value)}
          placeholder="Descrição"
        />
        <button type="button" className="row-delete-btn" onClick={() => onDelete(reminder.id)} title="Remover">
          ✕
        </button>
      </div>

      <div className="reminder-card-fields">
        <label>
          Valor
          <input
            type="number"
            className="cell-input"
            value={reminder.valor || ''}
            onChange={(e) => onUpdate(reminder.id, 'valor', Number(e.target.value) || 0)}
            step="0.01"
            min="0"
          />
        </label>
        <label>
          Parcela
          <input
            className="cell-input"
            value={reminder.parcela}
            onChange={(e) => onUpdate(reminder.id, 'parcela', e.target.value)}
            placeholder="1/12"
          />
        </label>
        <label>
          Status
          <select
            className="cell-input"
            value={reminder.status}
            onChange={(e) => onUpdate(reminder.id, 'status', e.target.value as ExpenseReminder['status'])}
          >
            <option value="unpaid">A pagar</option>
            <option value="paid">Pago</option>
          </select>
        </label>
        <label className="reminder-card-field--wide">
          Link
          <LinkField reminder={reminder} onUpdate={onUpdate} stacked />
        </label>
        <label className="reminder-card-field--wide">
          Obs.
          <input
            className="cell-input"
            value={reminder.observacao}
            onChange={(e) => onUpdate(reminder.id, 'observacao', e.target.value)}
            placeholder="Observação"
          />
        </label>
      </div>

      <footer className="reminder-card-footer">
        <strong className="reminder-card-total">{formatCurrency(reminder.valor)}</strong>
      </footer>
    </article>
  );
}

function LinkField({
  reminder,
  onUpdate,
  stacked = false,
}: {
  reminder: ExpenseReminder;
  onUpdate: RowProps['onUpdate'];
  stacked?: boolean;
}) {
  const href = normalizeLink(reminder.link);

  return (
    <div className={stacked ? 'link-field link-field--stacked' : 'link-field'}>
      <input
        className="cell-input"
        value={reminder.link}
        onChange={(e) => onUpdate(reminder.id, 'link', e.target.value)}
        placeholder="https://..."
      />
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className="link-open-btn" title="Abrir link">
          ↗
        </a>
      )}
    </div>
  );
}

function normalizeLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
