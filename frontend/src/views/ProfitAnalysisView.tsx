import { useEffect, useState } from 'react';
import { BarChart3, CalendarRange, HandCoins, Wallet } from 'lucide-react';
import { FinancialReport, FinancialReportOrigin } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

const panelClass =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm';
const inputClass =
  'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

type ProfitAnalysisViewProps = {
  report: FinancialReport | null;
  onRefreshReport: (input?: {
    days?: number;
    origin?: FinancialReportOrigin;
  }) => Promise<void>;
};

export const ProfitAnalysisView = ({
  report,
  onRefreshReport,
}: ProfitAnalysisViewProps) => {
  const [days, setDays] = useState('30');
  const [origin, setOrigin] = useState<FinancialReportOrigin>('todas');

  useEffect(() => {
    void onRefreshReport({ days: 30, origin: 'todas' });
  }, [onRefreshReport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Relatorios financeiros
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Consolidado de faturamento e lucratividade por OS e vendas de balcao.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Periodo
            </span>
            <select
              value={days}
              onChange={(event) => setDays(event.target.value)}
              className={inputClass}
            >
              <option value="7">Ultimos 7 dias</option>
              <option value="15">Ultimos 15 dias</option>
              <option value="30">Ultimos 30 dias</option>
              <option value="90">Ultimos 90 dias</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Origem
            </span>
            <select
              value={origin}
              onChange={(event) =>
                setOrigin(event.target.value as FinancialReportOrigin)
              }
              className={inputClass}
            >
              <option value="todas">Todas</option>
              <option value="ordem_servico">Ordens de servico</option>
              <option value="venda">Vendas</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              void onRefreshReport({
                days: Number.parseInt(days, 10),
                origin,
              })
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`${panelClass} rounded-2xl p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Faturamento
            </span>
            <Wallet size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(report?.summary.totalRevenue ?? 0)}
          </div>
        </div>
        <div className={`${panelClass} rounded-2xl p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Lucro
            </span>
            <HandCoins size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(report?.summary.totalProfit ?? 0)}
          </div>
        </div>
        <div className={`${panelClass} rounded-2xl p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              OS rentaveis
            </span>
            <BarChart3 size={18} className="text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {report?.byOrigin.ordem_servico.quantity ?? 0}
          </div>
        </div>
        <div className={`${panelClass} rounded-2xl p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Vendas no periodo
            </span>
            <CalendarRange size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {report?.byOrigin.venda.quantity ?? 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${panelClass} rounded-2xl p-5 xl:col-span-2`}>
          <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
            Itens mais rentaveis no periodo
          </h3>
          <div className="space-y-3">
            {(report?.items ?? []).slice(0, 12).map((item) => (
              <div
                key={`${item.origin}-${item.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.reference} • {item.customer}
                  </div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {item.description}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {item.origin === 'ordem_servico' ? 'OS' : 'Venda'} • {formatDate(item.date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="mt-1 text-sm font-bold text-emerald-600">
                    Lucro {formatCurrency(item.profit)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Margem{' '}
                    {item.value > 0
                      ? `${((item.profit / item.value) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </div>
                </div>
              </div>
            ))}
            {(report?.items ?? []).length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhum dado financeiro encontrado para o filtro atual.
              </p>
            )}
          </div>
        </div>

        <div className={`${panelClass} rounded-2xl p-5`}>
          <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
            Formas de pagamento
          </h3>
          <div className="space-y-3">
            {Object.entries(report?.byPaymentMethod ?? {}).map(([method, value]) => (
              <div
                key={method}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="text-sm font-medium capitalize text-slate-600 dark:text-slate-300">
                  {method.replace('_', ' ')}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            {Object.keys(report?.byPaymentMethod ?? {}).length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sem pagamentos registrados no periodo.
              </p>
            )}
          </div>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`${panelClass} rounded-2xl p-5`}>
            <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
              Consolidado por origem
            </h3>
            <div className="space-y-3">
              {(
                [
                  ['ordem_servico', 'Ordens de servico'],
                  ['venda', 'Vendas de balcao'],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {label}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Faturamento</span>
                    <span>{formatCurrency(report.byOrigin[key].revenue)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Lucro</span>
                    <span>{formatCurrency(report.byOrigin[key].profit)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Quantidade</span>
                    <span>{report.byOrigin[key].quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={`${panelClass} rounded-2xl p-5`}>
            <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
              Leitura rapida
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                A origem mais rentavel no filtro atual e{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {report.byOrigin.ordem_servico.profit >= report.byOrigin.venda.profit
                    ? 'ordem de servico'
                    : 'venda de balcao'}
                </span>
                .
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                O ticket medio aproximado no periodo esta em{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(
                    report.items.length > 0
                      ? report.summary.totalRevenue / report.items.length
                      : 0,
                  )}
                </span>
                .
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
