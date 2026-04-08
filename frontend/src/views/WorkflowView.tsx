import { Activity, ArrowRight, CheckCircle2, CircleDollarSign, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn, formatCurrency } from '../lib/utils';
import {
  getNextServiceAction,
  isOpenServiceStatus,
  serviceStatusBadgeClass,
  serviceStatusLabel,
  serviceStatusPanelClass,
  workflowColumns,
} from '../lib/serviceStatus';
import { ServiceOrder, ServiceStatus } from '../types';

type WorkflowViewProps = {
  services: ServiceOrder[];
  isBusy: boolean;
  onRequestPaymentMethod: (input: {
    title: string;
    description: string;
    amount?: number | null;
    defaultValue?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia';
    confirmLabel?: string;
  }) => Promise<
    'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | null
  >;
  onUpdateServiceStatus: (inputId: string, input: {
    status: ServiceStatus;
    paymentMethod?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia';
  }) => Promise<void>;
};

const metricCardClass =
  'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900';

export const WorkflowView = ({
  services,
  isBusy,
  onRequestPaymentMethod,
  onUpdateServiceStatus,
}: WorkflowViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleServices = useMemo(
    () =>
      services.filter((service) => {
        if (normalizedSearch.length === 0) return true;

        return [
          service.id,
          service.customerName,
          service.customerPhone,
          service.deviceBrand,
          service.deviceModel,
          service.issueDescription,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      }),
    [normalizedSearch, services],
  );

  const servicesByStatus = useMemo(
    () =>
      workflowColumns.reduce(
        (accumulator, column) => ({
          ...accumulator,
          [column.id]: visibleServices
            .filter((service) => service.status === column.id)
            .sort(
              (first, second) =>
                new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
            ),
        }),
        {} as Record<ServiceStatus, ServiceOrder[]>,
      ),
    [visibleServices],
  );

  const metrics = useMemo(() => {
    const openOrders = visibleServices.filter((service) => isOpenServiceStatus(service.status));
    const readyOrders = visibleServices.filter(
      (service) => service.status === 'pronto_para_retirada',
    );
    const inProgressOrders = visibleServices.filter(
      (service) => service.status === 'em_conserto',
    );
    const deliveredRevenue = visibleServices
      .filter((service) => service.status === 'entregue')
      .reduce((total, service) => total + service.totalPrice, 0);

    return {
      openOrders: openOrders.length,
      readyOrders: readyOrders.length,
      inProgressOrders: inProgressOrders.length,
      deliveredRevenue,
    };
  }, [visibleServices]);

  const handleStatusUpdate = async (service: ServiceOrder, status: ServiceStatus) => {
    if (status === service.status) {
      return;
    }

    if (status === 'entregue') {
      const paymentMethod = await onRequestPaymentMethod({
        title: 'Receber antes da entrega',
        description: `${service.customerName} • ${service.deviceBrand} ${service.deviceModel}`,
        amount: service.totalPrice,
        defaultValue: 'pix',
        confirmLabel: 'Receber e marcar como entregue',
      });

      if (!paymentMethod) {
        return;
      }

      await onUpdateServiceStatus(service.id, {
        status,
        paymentMethod,
      });
      return;
    }

    await onUpdateServiceStatus(service.id, { status });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={metricCardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              OS em aberto
            </span>
            <Activity size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics.openOrders}
          </div>
        </div>

        <div className={metricCardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Na bancada
            </span>
            <ArrowRight size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics.inProgressOrders}
          </div>
        </div>

        <div className={metricCardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Aguardando retirada
            </span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics.readyOrders}
          </div>
        </div>

        <div className={metricCardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Faturado nas entregas
            </span>
            <CircleDollarSign size={18} className="text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(metrics.deliveredRevenue)}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Fluxo das Ordens de Servico
            </h3>
          </div>

          <label className="relative block w-full max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar cliente, aparelho, defeito ou numero da OS"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-5 xl:grid-cols-3">
        {workflowColumns.map((column) => {
          const columnServices = servicesByStatus[column.id] ?? [];
          const Icon = column.icon;

          return (
            <section
              key={column.id}
              className="flex min-h-[320px] flex-col rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-3.5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {column.title}
                    </h4>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {columnServices.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {columnServices.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                    Nenhuma OS nesta etapa.
                  </div>
                )}

                {columnServices.map((service) => {
                  const nextAction = getNextServiceAction(service.status);

                  return (
                    <article
                      key={service.id}
                      className={cn(
                        'rounded-2xl border p-3.5 shadow-sm transition-all',
                        'hover:-translate-y-0.5 hover:shadow-md',
                        serviceStatusPanelClass[service.status],
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {service.customerName}
                          </h5>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {service.deviceBrand} {service.deviceModel}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-bold',
                            serviceStatusBadgeClass[service.status],
                          )}
                        >
                            {serviceStatusLabel[service.status]}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                        {service.issueDescription}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/70">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            OS
                          </div>
                          <div className="mt-1 font-mono">{service.id}</div>
                        </div>
                        <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/70">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            Valor
                          </div>
                          <div className="mt-1">{formatCurrency(service.totalPrice)}</div>
                        </div>
                        <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/70">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            Atualizada
                          </div>
                          <div className="mt-1">
                            {new Date(service.updatedAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/70">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            Telefone
                          </div>
                          <div className="mt-1">{service.customerPhone || 'Nao informado'}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        {nextAction && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleStatusUpdate(service, nextAction.nextStatus)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                          >
                            {nextAction.label}
                            <ArrowRight size={16} />
                          </button>
                        )}

                        {service.status !== 'entregue' && service.status !== 'cancelada' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleStatusUpdate(service, 'cancelada')}
                            className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                          >
                            Cancelar OS
                          </button>
                        )}
                        <select
                          value={service.status}
                          disabled={isBusy}
                          onChange={(event) =>
                            void handleStatusUpdate(service, event.target.value as ServiceStatus)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          {workflowColumns.map((column) => (
                            <option key={column.id} value={column.id}>
                              {column.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
