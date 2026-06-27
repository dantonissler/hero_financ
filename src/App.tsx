import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppTab, Transaction } from './types';
import { buildAnalytics } from './lib/analytics';
import {
  DEFAULT_DATE_FILTER,
  filterTransactionsByDate,
  getAvailableMonths,
  getDateBounds,
} from './lib/dateFilter';
import type { DateFilterValue } from './lib/dateFilter';
import { loadDefaultStatements } from './lib/ofxParser';
import { useCategoryOverrides } from './hooks/useCategoryOverrides';
import { CashFlowChart } from './components/CashFlowChart';
import { CaixinhaPanel } from './components/CaixinhaPanel';
import { CategoryChart } from './components/CategoryChart';
import { CategoryRulesPanel } from './components/CategoryRulesPanel';
import { DateFilter } from './components/DateFilter';
import { FileUploader } from './components/FileUploader';
import { InsightsPanel } from './components/InsightsPanel';
import { RemindersTab } from './components/RemindersTab';
import { SummaryCards } from './components/SummaryCards';
import { TabNav } from './components/TabNav';
import { TransactionTable } from './components/TransactionTable';
import { formatDate } from './lib/analytics';
import { buildCaixinhaSummary } from './lib/caixinhaAnalytics';
import './App.css';

function mergeTransactions(items: Transaction[]): Transaction[] {
  const unique = new Map<string, Transaction>();
  for (const transaction of items) {
    unique.set(transaction.id, transaction);
  }
  return [...unique.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('extrato');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(DEFAULT_DATE_FILTER);
  const [loadingStatements, setLoadingStatements] = useState(true);
  const [statementsError, setStatementsError] = useState<string | null>(null);
  const { setCategory, deleteRule, applyOverrides, overrides } = useCategoryOverrides();

  const loadStatements = useCallback(async () => {
    setLoadingStatements(true);
    setStatementsError(null);
    try {
      const loaded = await loadDefaultStatements();
      setTransactions(mergeTransactions(loaded));
    } catch (err) {
      setStatementsError(err instanceof Error ? err.message : 'Erro ao carregar extratos');
    } finally {
      setLoadingStatements(false);
    }
  }, []);

  useEffect(() => {
    void loadStatements();
  }, [loadStatements]);

  const categorizedTransactions = useMemo(
    () => applyOverrides(transactions),
    [transactions, applyOverrides],
  );

  const availableMonths = useMemo(() => getAvailableMonths(categorizedTransactions), [categorizedTransactions]);
  const dateBounds = useMemo(() => getDateBounds(categorizedTransactions), [categorizedTransactions]);

  const filteredTransactions = useMemo(
    () => filterTransactionsByDate(categorizedTransactions, dateFilter),
    [categorizedTransactions, dateFilter],
  );

  const analytics = useMemo(() => {
    if (filteredTransactions.length === 0) return null;
    return buildAnalytics(filteredTransactions);
  }, [filteredTransactions]);

  const caixinhaSummary = useMemo(() => {
    if (categorizedTransactions.length === 0 || filteredTransactions.length === 0) return null;
    return buildCaixinhaSummary(categorizedTransactions, filteredTransactions);
  }, [categorizedTransactions, filteredTransactions]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">hero_financ</p>
          <h1>Seu dinheiro, sem mistério</h1>
          <p className="hero-subtitle">
            Extrato OFX, reserva na caixinha e lembretes de gastos — tudo local no navegador.
          </p>
          {analytics && activeTab === 'extrato' && (
            <p className="date-range">
              Período: {formatDate(analytics.dateRange.start)} — {formatDate(analytics.dateRange.end)}
            </p>
          )}
        </div>
        <div className="hero-actions">
          <button type="button" className="ghost-btn" onClick={() => void loadStatements()} disabled={loadingStatements}>
            Recarregar contas/
          </button>
        </div>
      </header>

      <TabNav active={activeTab} onChange={setActiveTab} />

      {activeTab === 'extrato' && (
        <>
          <FileUploader
            loading={loadingStatements}
            onLoad={(items) => {
              setTransactions(mergeTransactions(items));
              setDateFilter(DEFAULT_DATE_FILTER);
              setStatementsError(null);
            }}
          />

          {statementsError && <p className="error-banner">{statementsError}</p>}
          {loadingStatements && <p className="loading-state">Carregando extratos...</p>}

          {!loadingStatements && transactions.length === 0 && (
            <p className="empty-state">Nenhum extrato carregado. Importe arquivos .ofx ou coloque-os em public/contas/.</p>
          )}

          {!loadingStatements && transactions.length > 0 && (
            <DateFilter
              months={availableMonths}
              bounds={dateBounds}
              value={dateFilter}
              onChange={setDateFilter}
            />
          )}

          {!loadingStatements && transactions.length > 0 && filteredTransactions.length === 0 && (
            <p className="empty-state">Nenhuma transação no período selecionado.</p>
          )}

          {analytics && (
            <>
              <SummaryCards summary={analytics.summary} />
              {caixinhaSummary && <CaixinhaPanel summary={caixinhaSummary} />}
              <div className="charts-grid">
                <CashFlowChart data={analytics.monthlyFlow} />
                <CategoryChart data={analytics.categoryBreakdown} />
              </div>
              <InsightsPanel insights={analytics.insights} topMerchants={analytics.topMerchants} />
              <CategoryRulesPanel
                rules={overrides.containsRules}
                onDeleteRule={deleteRule}
              />
              <TransactionTable
                transactions={analytics.transactions}
                onCategoryChange={setCategory}
              />
            </>
          )}
        </>
      )}

      {activeTab === 'lembretes' && <RemindersTab transactions={categorizedTransactions} />}
    </div>
  );
}
