import { useEffect, useState } from 'react';
import { BarChart3, CalendarRange, HandCoins, Wallet } from 'lucide-react';
import {
  ActionButton,
  EmptyState,
  MetricCard,
  PageHeader,
  Panel,
  Toolbar,
} from '../components/ui/primitives';
import { FinancialReport, FinancialReportOrigin } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

const inputClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

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
      <PageHeader
        title="Relatorios financeiros"
        description="Acompanhe faturamento, lucro e origem das receitas com leitura operacional mais direta."
      />

      <Toolbar>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
        </div>
        <ActionButton
          variant="primary"
          onClick={() =>
            void onRefreshReport({
              days: Number.parseInt(days, 10),
              origin,
            })
          }
        >
          Atualizar leitura
        </ActionButton>
      </Toolbar>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Faturamento"
          value={formatCurrency(report?.summary.totalRevenue ?? 0)}
          icon={<Wallet size={16} />}
        />
        <MetricCard
          label="Lucro"
          value={formatCurrency(report?.summary.totalProfit ?? 0)}
          icon={<HandCoins size={16} />}
          tone="success"
        />
        <MetricCard
          label="OS rentaveis"
          value={report?.byOrigin.ordem_servico.quantity ?? 0}
          icon={<BarChart3 size={16} />}
        />
        <MetricCard
          label="Vendas no periodo"
          value={report?.byOrigin.venda.quantity ?? 0}
          icon={<CalendarRange size={16} />}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Itens mais rentaveis
          </h3>
          <div className="mt-4 space-y-3">
            {(report?.items ?? []).slice(0, 12).map((item) => (
              <div
                key={`${item.origin}-${item.id}`}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.reference} - {item.customer}
                    </div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {item.description}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.origin === 'ordem_servico' ? 'OS' : 'Venda'} - {formatDate(item.date)}
                    </div>
                  </div>
                  <div className="text-sm lg:text-right">
                    <div className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.value)}
                    </div>
                    <div className="mt-1 font-semibold tabular-nums text-emerald-600 dark:text-emerald-300">
                      Lucro {formatCurrency(item.profit)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Margem{' '}
                      {item.value > 0
                        ? `${((item.profit / item.value) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(report?.items ?? []).length === 0 ? (
              <EmptyState
                title="Sem dados no filtro atual"
                description="Ajuste o periodo ou a origem para consultar outro recorte financeiro."
              />
            ) : null}
          </div>
        </Panel>

        <Panel>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Formas de pagamento
          </h3>
          <div className="mt-4 space-y-3">
            {Object.entries(report?.byPaymentMethod ?? {}).map(([method, value]) => (
              <div
                key={method}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="text-sm capitalize text-slate-600 dark:text-slate-300">
                  {method.replace('_', ' ')}
                </span>
                <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            {Object.keys(report?.byPaymentMethod ?? {}).length === 0 ? (
              <EmptyState
                title="Sem pagamentos registrados"
                description="Nao houve movimentacao financeira para o recorte selecionado."
              />
            ) : null}
          </div>
        </Panel>
      </div>

      {report ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Consolidado por origem
            </h3>
            <div className="mt-4 space-y-3">
              {(
                [
                  ['ordem_servico', 'Ordens de servico'],
                  ['venda', 'Vendas de balcao'],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {label}
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Faturamento</span>
                      <span className="tabular-nums">
                        {formatCurrency(report.byOrigin[key].revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lucro</span>
                      <span className="tabular-nums">
                        {formatCurrency(report.byOrigin[key].profit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quantidade</span>
                      <span className="tabular-nums">{report.byOrigin[key].quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Leitura rapida
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                A origem mais rentavel no filtro atual e{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {report.byOrigin.ordem_servico.profit >= report.byOrigin.venda.profit
                    ? 'ordem de servico'
                    : 'venda de balcao'}
                </span>
                .
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                O ticket medio aproximado no periodo esta em{' '}
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCurrency(
                    report.items.length > 0
                      ? report.summary.totalRevenue / report.items.length
                      : 0,
                  )}
                </span>
                .
              </div>
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
};
