import type { DateFilterValue } from '../lib/dateFilter';
import { formatMonthLabel } from '../lib/dateFilter';

interface Props {
  months: string[];
  bounds: { min: string; max: string } | null;
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

export function DateFilter({ months, bounds, value, onChange }: Props) {
  function selectMonth(month: string) {
    onChange({ mode: 'month', month });
  }

  function selectAll() {
    onChange({ mode: 'all' });
  }

  function updateRange(field: 'startDate' | 'endDate', date: string) {
    onChange({
      mode: 'range',
      startDate: field === 'startDate' ? date : value.startDate,
      endDate: field === 'endDate' ? date : value.endDate,
    });
  }

  return (
    <section className="date-filter panel">
      <header className="panel-header">
        <h2>Período</h2>
        <p>Selecione um mês ou defina um intervalo de datas</p>
      </header>

      <div className="month-chips">
        <button
          type="button"
          className={value.mode === 'all' ? 'month-chip active' : 'month-chip'}
          onClick={selectAll}
        >
          Todos
        </button>
        {months.map((month) => (
          <button
            key={month}
            type="button"
            className={value.mode === 'month' && value.month === month ? 'month-chip active' : 'month-chip'}
            onClick={() => selectMonth(month)}
          >
            {formatMonthLabel(month)}
          </button>
        ))}
      </div>

      <div className="date-range-fields">
        <label>
          De
          <input
            type="date"
            min={bounds?.min}
            max={bounds?.max}
            value={value.mode === 'range' ? (value.startDate ?? '') : ''}
            onChange={(e) => updateRange('startDate', e.target.value)}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            min={bounds?.min}
            max={bounds?.max}
            value={value.mode === 'range' ? (value.endDate ?? '') : ''}
            onChange={(e) => updateRange('endDate', e.target.value)}
          />
        </label>
        {(value.mode === 'range' && (value.startDate || value.endDate)) && (
          <button
            type="button"
            className="ghost-btn ghost-btn--small"
            onClick={() => onChange({ mode: 'all' })}
          >
            Limpar
          </button>
        )}
      </div>
    </section>
  );
}
