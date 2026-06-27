import type { Insight, MerchantSummary } from '../types';
import { formatCurrency } from '../lib/analytics';
import { CollapsiblePanel } from './CollapsiblePanel';

interface Props {
  insights: Insight[];
  topMerchants: MerchantSummary[];
}

export function InsightsPanel({ insights, topMerchants }: Props) {
  return (
    <section className="insights-grid">
      <CollapsiblePanel
        title="Insights"
        subtitle="Padrões encontrados no seu extrato"
        count={insights.length}
      >
        <ul className="insights-list">
          {insights.map((insight, index) => (
            <li key={index} className={`insight insight--${insight.type}`}>
              <strong>{insight.title}</strong>
              <p>{insight.description}</p>
            </li>
          ))}
        </ul>
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Top gastos"
        subtitle="Estabelecimentos e destinos"
        count={topMerchants.length}
      >
        <ul className="merchant-list">
          {topMerchants.map((merchant, index) => (
            <li key={merchant.name}>
              <span className="merchant-rank">{index + 1}</span>
              <div className="merchant-info">
                <strong>{merchant.name}</strong>
                <span>{merchant.category} · {merchant.count}x</span>
              </div>
              <span className="merchant-total">{formatCurrency(merchant.total)}</span>
            </li>
          ))}
        </ul>
      </CollapsiblePanel>
    </section>
  );
}
