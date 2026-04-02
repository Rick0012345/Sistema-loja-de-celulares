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
import { cn, formatCurrency } from '../lib/utils';
import { StatCard } from '../components/StatCard';
import { DashboardSummary, ServiceOrder, ServiceStatus, ThemeMode } from '../types';

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
};

export const DashboardView = ({
  stats,
  services,
  theme,
  summary,
}: DashboardViewProps) => {
  const chartData = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index);
    const dayKey = format(date, 'dd/MM');
    const dayRevenue = services
      .filter(
        (service) =>
          service.status === 'delivered' &&
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
      pending: 0,
      in_progress: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    },
  );

  const statusData = [
    { name: 'Pendente', value: counts.pending, color: '#94a3b8' },
    { name: 'Em Conserto', value: counts.in_progress, color: '#3b82f6' },
    { name: 'Pronto', value: counts.ready, color: '#10b981' },
    { name: 'Entregue', value: counts.delivered, color: '#6366f1' },
  ].filter((item) => item.value > 0);

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Lucro Liquido"
          value={formatCurrency(stats.profit)}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Servicos em Aberto"
          value={stats.pendingServices.toString()}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Estoque Baixo"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
          color="rose"
          isWarning={stats.lowStockItems > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className={cn('rounded-2xl p-6 lg:col-span-2', panelClass)}>
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
            <TrendingUp size={20} className="text-blue-600" />
            Faturamento dos ultimos 7 dias
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 12 }} tickFormatter={(value) => `R$${value}`} />
                <Tooltip cursor={{ fill: chartTheme.tooltipCursor }} contentStyle={chartTheme.tooltipStyle} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn('rounded-2xl p-6', panelClass)}>
          <h3 className="mb-6 text-lg font-bold">Status dos Servicos</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
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
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className={cn('rounded-2xl p-6', panelClass)}>
            <h3 className="mb-5 text-lg font-bold">Ordens Recentes</h3>
            <div className="space-y-4">
              {summary.recentOrders.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ainda nao existem ordens recentes no backend.
                </p>
              )}
              {summary.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div>
                    <p className="font-semibold">{order.deviceLabel}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {order.customerName} • {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.totalPrice)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {order.statusLabel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn('rounded-2xl p-6', panelClass)}>
            <h3 className="mb-5 text-lg font-bold">Produtos com Estoque Baixo</h3>
            <div className="space-y-4">
              {summary.lowStockProducts.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhum produto em nivel critico no backend.
                </p>
              )}
              {summary.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Minimo recomendado: {product.minStock}
                    </p>
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
    </div>
  );
};
