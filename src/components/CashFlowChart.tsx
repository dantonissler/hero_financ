import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyFlow } from '../types';
import { formatCurrency } from '../lib/analytics';

interface Props {
  data: MonthlyFlow[];
}

export function CashFlowChart({ data }: Props) {
  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Fluxo de caixa mensal</h2>
        <p>Comparativo de entradas e saídas por mês</p>
      </header>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
              }}
            />
            <Legend />
            <Bar dataKey="income" name="Entradas" fill="var(--green)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" name="Saídas" fill="var(--red)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
