import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ServiceOrderDetailsModal } from '../components/ServiceOrderDetailsModal';
import { cn, formatCurrency } from '../lib/utils';
import {
  getNextServiceAction,
  isOpenServiceStatus,
  serviceStatusBadgeClass,
  serviceStatusLabel,
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
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

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

  const sortedServices = useMemo(
    () =>
      [...visibleServices].sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
      ),
    [visibleServices],
  );

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
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

  const openServiceDetails = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  const closeServiceDetails = () => {
    setSelectedServiceId(null);
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
              Fluxo das Ordens de Serviço
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Acompanhe as etapas no kanban ou use a lista para uma leitura mais executiva.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                  viewMode === 'kanban'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
                )}
              >
                <LayoutGrid size={16} />
                Fluxo
              </button>
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                  viewMode === 'lista'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
                )}
              >
                <List size={16} />
                Lista
              </button>
            </div>

            <label className="relative block w-full max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar cliente, aparelho, defeito ou número da OS"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-5 xl:grid-cols-3">
          {workflowColumns.map((column) => {
            const columnServices = servicesByStatus[column.id] ?? [];
            const Icon = column.icon;

            return (
              <section
                key={column.id}
                className="flex h-[min(72vh,680px)] min-h-[320px] flex-col rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-3.5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950"
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

                <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  {columnServices.length === 0 && (
                    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      Nenhuma OS nesta etapa.
                    </div>
                  )}

                  {columnServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => openServiceDetails(service.id)}
                      aria-haspopup="dialog"
                      className="rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80 dark:hover:border-blue-500/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h5 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                            {service.customerName}
                          </h5>
                          <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
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

                      <p className="mt-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {service.issueDescription}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(service.totalPrice)}
                          </div>
                          <div className="mt-1 text-slate-500 dark:text-slate-400">
                            {new Date(service.updatedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-300">
                          Abrir
                          <ChevronRight size={15} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_180px_150px_130px_minmax(240px,1fr)] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400 lg:grid">
            <span>Cliente</span>
            <span>Aparelho e defeito</span>
            <span>Status</span>
            <span>Atualização</span>
            <span>Valor</span>
            <span>Ações</span>
          </div>

          {sortedServices.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhuma ordem de serviço encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {sortedServices.map((service) => {
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => openServiceDetails(service.id)}
                    aria-haspopup="dialog"
                    className="grid w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/70 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_180px_150px_130px_120px] lg:items-center lg:px-5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {service.customerName}
                      </div>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {service.customerPhone || 'Não informado'}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {service.deviceBrand} {service.deviceModel}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                        {service.issueDescription}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-bold',
                          serviceStatusBadgeClass[service.status],
                        )}
                      >
                        {serviceStatusLabel[service.status]}
                      </span>
                      {service.status === 'pronto_para_retirada' && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          {service.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      <div className="font-semibold text-slate-700 dark:text-slate-200">
                        {new Date(service.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="mt-1">
                        {new Date(service.updatedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(service.totalPrice)}
                    </div>

                    <div className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-300 lg:justify-end">
                      Ver detalhes
                      <ChevronRight size={16} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ServiceOrderDetailsModal
        isOpen={selectedService !== null}
        service={selectedService}
        isBusy={isBusy}
        onClose={closeServiceDetails}
        onUpdateStatus={handleStatusUpdate}
      />
    </div>
  );
};
