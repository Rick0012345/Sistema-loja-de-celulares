import { AlertTriangle, Clock, DollarSign, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { serviceStatusLabel } from '../lib/serviceStatus';
import { cn, formatCurrency, formatDateTime } from '../lib/utils';
import { StatCard } from '../components/StatCard';
import {
  DashboardSummary,
  ProfessionalOperationPanel,
  ServiceOrder,
  ServiceStatus,
  ThemeMode,
} from '../types';

const panelClass =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm';

type DashboardViewProps = {
  stats: {
    totalRevenue: number;
    totalCosts: number;
    profit: number;
    pendingServices: number;
    lowStockItems: number;
  };
  services: ServiceOrder[];
  theme: ThemeMode;
  summary: DashboardSummary | null;
  professionalOperation: ProfessionalOperationPanel | null;
};

export const DashboardView = ({
  stats,
  services,
  theme,
  summary,
  professionalOperation,
}: DashboardViewProps) => {
  const chartData = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index);
    const dayKey = format(date, 'dd/MM');
    const dayRevenue = services
      .filter(
        (service) =>
          service.status === 'entregue' &&
          format(new Date(service.updatedAt), 'dd/MM') === dayKey,
      )
      .reduce((accumulator, service) => accumulator + service.totalPrice, 0);

    return { name: dayKey, revenue: dayRevenue };
  });

  const counts = services.reduce<Record<ServiceStatus, number>>(
    (accumulator, service) => {
      accumulator[service.status] += 1;
      return accumulator;
    },
    {
      aguardando_orcamento: 0,
      aguardando_aprovacao: 0,
      aguardando_peca: 0,
      em_conserto: 0,
      pronto_para_retirada: 0,
      entregue: 0,
      cancelada: 0,
    },
  );

  const statusData = [
    {
      name: serviceStatusLabel.aguardando_orcamento,
      value: counts.aguardando_orcamento,
      color: '#94a3b8',
    },
    {
      name: serviceStatusLabel.aguardando_aprovacao,
      value: counts.aguardando_aprovacao,
      color: '#f59e0b',
    },
    {
      name: serviceStatusLabel.aguardando_peca,
      value: counts.aguardando_peca,
      color: '#f97316',
    },
    {
      name: serviceStatusLabel.em_conserto,
      value: counts.em_conserto,
      color: '#3b82f6',
    },
    {
      name: serviceStatusLabel.pronto_para_retirada,
      value: counts.pronto_para_retirada,
      color: '#10b981',
    },
    {
      name: serviceStatusLabel.entregue,
      value: counts.entregue,
      color: '#6366f1',
    },
  ].filter((item) => item.value > 0);

  const overview = summary?.indicators ?? {
    faturamentoMes: stats.totalRevenue,
    lucroMes: stats.profit,
    totalOrdensAbertas: stats.pendingServices,
    totalProdutosBaixoEstoque: stats.lowStockItems,
  };

  const chartTheme =
    theme === 'dark'
      ? {
          grid: '#1e293b',
          tick: '#94a3b8',
          tooltipCursor: '#172033',
          tooltipStyle: {
            borderRadius: '12px',
            border: '1px solid #1e293b',
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.35)',
          },
        }
      : {
          grid: '#f1f5f9',
          tick: '#64748b',
          tooltipCursor: '#f8fafc',
          tooltipStyle: {
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          },
        };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Faturamento do mes"
          value={formatCurrency(overview.faturamentoMes)}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Lucro do mes"
          value={formatCurrency(overview.lucroMes)}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Servicos em aberto"
          value={overview.totalOrdensAbertas.toString()}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Estoque baixo"
          value={overview.totalProdutosBaixoEstoque.toString()}
          icon={AlertTriangle}
          color="rose"
          isWarning={overview.totalProdutosBaixoEstoque > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={cn('rounded-2xl p-5 lg:col-span-2', panelClass)}>
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
            <TrendingUp size={20} className="text-blue-600" />
            Valor de OS entregues nos ultimos 7 dias
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={chartTheme.grid}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTheme.tick, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTheme.tick, fontSize: 12 }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                  cursor={{ fill: chartTheme.tooltipCursor }}
                  contentStyle={chartTheme.tooltipStyle}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn('rounded-2xl p-5', panelClass)}>
          <h3 className="mb-4 text-base font-bold">Status dos servicos</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={cn('rounded-2xl p-5', panelClass)}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold">Ordens recentes</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {summary.recentOrders.length} itens
              </span>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {summary.recentOrders.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma OS recente.
                </p>
              )}
              {summary.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div>
                    <p className="font-semibold">{order.deviceLabel}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {order.customerName} • {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.totalPrice)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {order.statusLabel}
                    </p>
                    {order.pendingBalance > 0 && (
                      <p className="text-xs font-semibold text-amber-600">
                        Saldo {formatCurrency(order.pendingBalance)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn('rounded-2xl p-5', panelClass)}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold">Produtos com estoque baixo</h3>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                {summary.lowStockProducts.length} alertas
              </span>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {summary.lowStockProducts.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhum item com estoque baixo.
                </p>
              )}
              {summary.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Minimo recomendado: {product.minStock}
                    </p>
                    {product.supplierName && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Fornecedor: {product.supplierName}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                    {product.stock} em estoque
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {summary && summary.operationalQueue.length > 0 && (
        <div className={cn('rounded-2xl p-5', panelClass)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-bold">Fila operacional critica</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {summary.operationalQueue.length} em acompanhamento
            </span>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {summary.operationalQueue.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {item.customerName} • {item.deviceLabel}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {serviceStatusLabel[item.status]}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Atualizado em {formatDateTime(item.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.pendingBalance > 0 && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      Saldo {formatCurrency(item.pendingBalance)}
                    </span>
                  )}
                  {item.readyWithoutContactSent && (
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      Contato pendente
                    </span>
                  )}
                  {item.waitingSupplierItem && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      Aguardando fornecedor
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {professionalOperation && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={cn('rounded-2xl p-5', panelClass)}>
            <h3 className="mb-4 text-base font-bold">Alertas operacionais</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  OS paradas ha dias: {professionalOperation.alerts.stalledOrders.length}
                </p>
                {professionalOperation.alerts.stalledOrders.slice(0, 3).map((item) => (
                  <p key={item.id} className="mt-1 text-slate-500 dark:text-slate-400">
                    {item.customer} • {item.device} • {formatDateTime(item.updatedAt)}
                  </p>
                ))}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Integracoes falhando: {professionalOperation.alerts.failingIntegrations.length}
                </p>
                {professionalOperation.alerts.failingIntegrations
                  .slice(0, 3)
                  .map((item) => (
                    <p
                      key={item.orderId}
                      className="mt-1 text-slate-500 dark:text-slate-400"
                    >
                      {item.customer} • {serviceStatusLabel[item.status]}
                    </p>
                  ))}
              </div>
            </div>
          </div>

          <div className={cn('rounded-2xl p-5', panelClass)}>
            <h3 className="mb-4 text-base font-bold">Painel operacional</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">OS atrasadas</span>
                <strong>{professionalOperation.indicators.overdueOrders}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Webhooks pendentes</span>
                <strong>{professionalOperation.integrations.pendentesReenvio}</strong>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  OS por tecnico
                </p>
                {professionalOperation.indicators.ordersByTechnician
                  .slice(0, 4)
                  .map((item) => (
                    <div
                      key={item.technicianId}
                      className="mt-2 flex items-center justify-between text-slate-500 dark:text-slate-400"
                    >
                      <span>{item.technicianName}</span>
                      <strong className="text-slate-900 dark:text-slate-100">
                        {item.quantity}
                      </strong>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
