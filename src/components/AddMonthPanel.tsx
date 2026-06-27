import { useState } from 'react';
import { getCurrentMonthKey, getNextMonthKey, monthLabelFromKey } from '../lib/remindersDb';

interface Props {
  activeMonth: string;
  existingMonths: string[];
  onCreate: (monthKey: string, copyFrom?: string) => boolean;
}

export function AddMonthPanel({ activeMonth, existingMonths, onCreate }: Props) {
  const [newMonth, setNewMonth] = useState('');
  const [copyFromActive, setCopyFromActive] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  function tryCreate(monthKey: string) {
    if (!monthKey) return;

    const copyFrom = copyFromActive && activeMonth ? activeMonth : undefined;
    const created = onCreate(monthKey, copyFrom);

    if (created) {
      const label = monthLabelFromKey(monthKey);
      setFeedback(
        copyFrom
          ? `Mês ${label} criado com lembretes copiados de ${monthLabelFromKey(copyFrom)}.`
          : `Mês ${label} criado.`,
      );
      setNewMonth('');
    } else {
      setFeedback(`O mês ${monthLabelFromKey(monthKey)} já existe.`);
    }
  }

  const suggestedNext = activeMonth ? getNextMonthKey(activeMonth) : getCurrentMonthKey();
  const suggestedCurrent = getCurrentMonthKey();

  return (
    <section className="panel add-month-panel">
      <header className="panel-header">
        <h3>Criar novo mês</h3>
        <p>Adicione um mês vazio ou copie os lembretes do mês selecionado ({activeMonth ? monthLabelFromKey(activeMonth) : 'nenhum'}).</p>
      </header>

      <div className="add-month-actions">
        <button
          type="button"
          className="ghost-btn ghost-btn--small"
          onClick={() => tryCreate(suggestedCurrent)}
          disabled={existingMonths.includes(suggestedCurrent)}
        >
          Mês atual ({monthLabelFromKey(suggestedCurrent)})
        </button>
        <button
          type="button"
          className="ghost-btn ghost-btn--small"
          onClick={() => tryCreate(suggestedNext)}
          disabled={existingMonths.includes(suggestedNext)}
        >
          Próximo mês ({monthLabelFromKey(suggestedNext)})
        </button>
      </div>

      <div className="add-month-form">
        <label className="add-month-field">
          Escolher mês
          <input
            type="month"
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            className="search-input"
          />
        </label>

        <label className="add-month-checkbox">
          <input
            type="checkbox"
            checked={copyFromActive}
            onChange={(e) => setCopyFromActive(e.target.checked)}
            disabled={!activeMonth}
          />
          Copiar lembretes do mês selecionado
        </label>

        <button
          type="button"
          className="primary-btn"
          onClick={() => tryCreate(newMonth)}
          disabled={!newMonth}
        >
          Criar mês
        </button>
      </div>

      {feedback && <p className="add-month-feedback">{feedback}</p>}
    </section>
  );
}
