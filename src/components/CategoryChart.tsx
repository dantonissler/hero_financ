import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySummary } from '../types';
import { formatCurrency } from '../lib/analytics';

interface Props {
  data: CategorySummary[];
}

const COLORS = [
  '#6366f1', '#22c55e', '#f97316', '#ef4444', '#06b6d4',
  '#a855f7', '#eab308', '#ec4899', '#14b8a6', '#64748b',
];

export function CategoryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <section className="panel">
        <header className="panel-header">
          <h2>Gastos por categoria</h2>
        </header>
        <p className="empty-state">Sem despesas para categorizar.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Gastos por categoria</h2>
        <p>Onde seu dinheiro está saindo</p>
      </header>
      <div className="category-layout">
        <div className="chart-wrap chart-wrap--pie">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="category-list">
          {data.map((item, index) => (
            <li key={item.category}>
              <span className="category-dot" style={{ background: COLORS[index % COLORS.length] }} />
              <div>
                <strong>{item.category}</strong>
                <span>{formatCurrency(item.total)} · {item.percentage.toFixed(0)}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
